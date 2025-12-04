"""
Automated role-module access matrix tests using pytest + Selenium.

This file defines:
- USERS: role -> login credentials (for test env)
- MODULES: module_name -> route path + UI success selector
- ACCESS_MATRIX: role x module -> expected accessible (True/False)

For each role:
- Log in
- Visit each module URL
- Determine actual access via heuristics
- Assert actual vs expected and record results

Run with:
    pytest test_role_module_access.py -v

Adjust BASE_URL, LOGIN_SUCCESS_SELECTOR, USERS, MODULES, ACCESS_MATRIX
according to your application.
"""

import os
from typing import Dict, Any, List

import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# --------------------------------------------------------------------------
# Configuration
# --------------------------------------------------------------------------

BASE_URL = os.getenv("APP_BASE_URL", "http://localhost:3000")

# Selector that exists on the authenticated app shell (main content area)
LOGIN_SUCCESS_SELECTOR = "#main-content"

DEFAULT_DENY_MARKERS = [
    "access denied",
    "forbidden",
    "not authorized",
    "unauthorized",
    "permission denied",
]

USERS: Dict[str, Dict[str, str]] = {
    "Super Admin": {"username": "superadmin_user", "password": "super_pass"},
    "Admin": {"username": "admin_user", "password": "admin_pass"},
    "Alumni": {"username": "alumni_user", "password": "alumni_pass"},
    "Student": {"username": "student_user", "password": "student_pass"},
    "Employer": {"username": "employer_user", "password": "employer_pass"},
}

MODULES: Dict[str, Dict[str, Any]] = {
    "profile_settings": {
        "path": "/settings/profile",
        "success_selector": "[data-testid='profile-settings-root']",
    },
    "admin_settings": {
        "path": "/settings/admin",
        "success_selector": "[data-testid='admin-settings-root']",
    },
    "alumni_directory": {
        "path": "/alumni",
        "success_selector": "[data-testid='alumni-directory-root']",
    },
    "events": {
        "path": "/events",
        "success_selector": "[data-testid='events-root']",
    },
    "job_portal": {
        "path": "/jobs",
        "success_selector": "[data-testid='job-portal-root']",
    },
    "mentorship": {
        "path": "/mentorship",
        "success_selector": "[data-testid='mentorship-root']",
    },
    "groups": {
        "path": "/groups",
        "success_selector": "[data-testid='groups-root']",
    },
    "messages": {
        "path": "/messages",
        "success_selector": "[data-testid='messages-root']",
    },
}

ACCESS_MATRIX: Dict[str, Dict[str, bool]] = {
    "Super Admin": {name: True for name in MODULES.keys()},
    "Admin": {
        "profile_settings": True,
        "admin_settings": True,
        "alumni_directory": True,
        "events": True,
        "job_portal": True,
        "mentorship": True,
        "groups": True,
        "messages": True,
    },
    "Alumni": {
        "profile_settings": True,
        "admin_settings": False,
        "alumni_directory": True,
        "events": True,
        "job_portal": True,
        "mentorship": True,
        "groups": True,
        "messages": True,
    },
    "Student": {
        "profile_settings": True,
        "admin_settings": False,
        "alumni_directory": True,
        "events": True,
        "job_portal": True,
        "mentorship": True,
        "groups": True,
        "messages": True,
    },
    "Employer": {
        "profile_settings": True,
        "admin_settings": False,
        "alumni_directory": False,
        "events": True,
        "job_portal": True,
        "mentorship": False,
        "groups": False,
        "messages": True,
    },
}

ACCESS_RESULTS: List[Dict[str, Any]] = []


@pytest.fixture(scope="function")
def driver():
    options = ChromeOptions()
    options.add_argument("--headless=new")
    options.add_argument("--window-size=1280,800")
    driver = webdriver.Chrome(options=options)
    driver.implicitly_wait(5)
    yield driver
    driver.quit()


def login(driver: webdriver.Chrome, username: str, password: str) -> None:
    driver.get(f"{BASE_URL}/login")
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.NAME, "email"))
    )
    driver.find_element(By.NAME, "email").clear()
    driver.find_element(By.NAME, "email").send_keys(username)
    driver.find_element(By.NAME, "password").clear()
    driver.find_element(By.NAME, "password").send_keys(password)
    driver.find_element(By.XPATH, "//button[contains(text(), 'Login')]").click()
    WebDriverWait(driver, 15).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, LOGIN_SUCCESS_SELECTOR))
    )


def is_module_accessible(driver: webdriver.Chrome, module_name: str, module_cfg: Dict[str, Any]) -> bool:
    current_url = driver.current_url.lower()
    if current_url.rstrip("/").endswith("/login"):
        return False

    source = driver.page_source.lower()
    if any(marker in source for marker in DEFAULT_DENY_MARKERS):
        return False

    success_selector = module_cfg.get("success_selector")
    if success_selector:
        try:
            WebDriverWait(driver, 5).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, success_selector))
            )
            return True
        except Exception:
            return False

    return True


@pytest.mark.parametrize("role", list(USERS.keys()), ids=list(USERS.keys()))
def test_role_module_access_matrix(role: str, driver: webdriver.Chrome):
    creds = USERS[role]
    login(driver, creds["username"], creds["password"])

    for module_name, module_cfg in MODULES.items():
        expected_access = ACCESS_MATRIX.get(role, {}).get(module_name, False)
        url = f"{BASE_URL}{module_cfg['path']}"
        driver.get(url)

        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )

        actual_access = is_module_accessible(driver, module_name, module_cfg)

        ACCESS_RESULTS.append(
            {
                "role": role,
                "module": module_name,
                "expected": expected_access,
                "actual": actual_access,
                "url": url,
            }
        )

        assert actual_access == expected_access, (
            f"[ACCESS MATRIX MISMATCH] Role={role}, Module={module_name}, "
            f"URL={url}, expected_access={expected_access}, actual_access={actual_access}"
        )


def pytest_sessionfinish(session, exitstatus):
    if not ACCESS_RESULTS:
        return

    print("\n\n================ Access Matrix Summary ================")
    print("Role           | Module             | Expected | Actual | Result")
    print("---------------+--------------------+----------+--------+--------")

    for entry in ACCESS_RESULTS:
        role = entry["role"]
        module = entry["module"]
        expected = entry["expected"]
        actual = entry["actual"]
        result_str = "PASS" if expected == actual else "FAIL"
        print(
            f"{role:<14}| {module:<19}| {str(expected):<8} | "
            f"{str(actual):<6} | {result_str}"
        )

    print("=======================================================\n")


if __name__ == "__main__":
    import sys

    errno = pytest.main([sys.argv[0]])
    raise SystemExit(errno)

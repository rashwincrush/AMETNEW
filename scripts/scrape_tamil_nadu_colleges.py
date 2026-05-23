#!/usr/bin/env python3
"""
Tamil Nadu College Alumni Platform Checker
Scrapes college websites to check for alumni platforms
"""

import requests
from bs4 import BeautifulSoup
import re
import time
import json
from urllib.parse import urljoin, urlparse
import csv
from datetime import datetime

# Alumni-related keywords to search for
ALUMNI_KEYWORDS = [
    'alumni', 'alumnus', 'alumna', 'graduates', 'former students',
    'alumni association', 'alumni network', 'alumni portal',
    'alumni directory', 'alumni chapter', 'alumni meet',
    'alumni registration', 'alumni login', 'alumni portal'
]

# College data extracted from Wikipedia
COLLEGES = [
    # Chennai
    {"name": "Loyola-ICAM College of Engineering and Technology", "district": "Chennai"},
    {"name": "BSA Crescent Engineering College", "district": "Chennai"},
    {"name": "R.M.K. Engineering College", "district": "Chennai"},
    {"name": "Chennai Institute of Technology", "district": "Chennai"},
    {"name": "Sri Sivasubramaniya Nadar College of Engineering", "district": "Chennai"},
    {"name": "Sri Sai Ram Engineering College", "district": "Chennai"},
    {"name": "Sri Sairam Institute of Technology", "district": "Chennai"},
    {"name": "Easwari Engineering College", "district": "Chennai"},
    {"name": "Jerusalem College of Engineering", "district": "Chennai"},
    {"name": "Hindustan Institute of Technology and Science", "district": "Chennai"},
    {"name": "Indian Institute of Information Technology Design & Manufacturing Kancheepuram", "district": "Chennai"},
    {"name": "Ethiraj College for Women", "district": "Chennai"},
    {"name": "A.M. Jain College", "district": "Chennai"},
    {"name": "Dr.MGR Janaki College of Arts and Science for Women", "district": "Chennai"},
    {"name": "Jaya Group of Colleges", "district": "Chennai"},
    
    # Coimbatore
    {"name": "PSG College of Technology", "district": "Coimbatore"},
    {"name": "Coimbatore Institute of Technology", "district": "Coimbatore"},
    {"name": "Government College of Technology, Coimbatore", "district": "Coimbatore"},
    {"name": "Rathinam Technical Campus", "district": "Coimbatore"},
    {"name": "Kumaraguru College of Technology", "district": "Coimbatore"},
    {"name": "KPR Institute of Engineering and Technology", "district": "Coimbatore"},
    {"name": "Sri Ramakrishna Engineering College", "district": "Coimbatore"},
    {"name": "Karpagam College of Engineering", "district": "Coimbatore"},
    {"name": "Sri Krishna College of Engineering & Technology", "district": "Coimbatore"},
    {"name": "SNS College of Technology", "district": "Coimbatore"},
    {"name": "Dr. Mahalingam College of Engineering and Technology", "district": "Coimbatore"},
    {"name": "Kumaraguru College of Liberal Arts and Science", "district": "Coimbatore"},
    {"name": "Adithya Institute of Technology", "district": "Coimbatore"},
    
    # Madurai
    {"name": "Thiagarajar College of Engineering", "district": "Madurai"},
    {"name": "Velammal College of Engineering and Technology", "district": "Madurai"},
    {"name": "Kamaraj College of Engineering and Technology", "district": "Madurai"},
    {"name": "Solamalai College of Engineering", "district": "Madurai"},
    {"name": "P.T.R College of Engineering and Technology", "district": "Madurai"},
    {"name": "Fathima Michael College of Engineering and Technology", "district": "Madurai"},
    {"name": "Ultra College of Engineering and Technology", "district": "Madurai"},
    {"name": "Vaigai College of Engineering", "district": "Madurai"},
    {"name": "KLN College of Information Technology", "district": "Madurai"},
    
    # Erode
    {"name": "Kongu Engineering College", "district": "Erode"},
    {"name": "Bannari Amman Institute of Technology", "district": "Erode"},
    {"name": "Erode Sengunthar Engineering College", "district": "Erode"},
    {"name": "Velalar College of Engineering and Technology", "district": "Erode"},
    {"name": "Institute of Road and Transport Technology", "district": "Erode"},
    
    # Kanchipuram
    {"name": "Thangavelu Engineering College", "district": "Kanchipuram"},
    {"name": "Kings Engineering College", "district": "Kanchipuram"},
    {"name": "Chennai Institute of Technology", "district": "Kanchipuram"},
    {"name": "Adhiparasakthi Engineering College", "district": "Kanchipuram"},
    {"name": "Mohamed Sathak AJ College of Engineering", "district": "Kanchipuram"},
    
    # Other districts
    {"name": "Arunachala College Of Engineering For Women", "district": "Kanniyakumari"},
    {"name": "M.Kumarasamy College of Engineering", "district": "Karur"},
    {"name": "Chettinad College of Engineering and Technology", "district": "Karur"},
    {"name": "Government College of Engineering, Bargur", "district": "Krishnagiri"},
    {"name": "Selvam College of Technology", "district": "Namakkal"},
    {"name": "J.K.K.Nattraja College of Engineering and Technology", "district": "Namakkal"},
    {"name": "Sengunthar Engineering College", "district": "Namakkal"},
    {"name": "A.V.C College of Engineering", "district": "Mayiladuthurai"},
    {"name": "E.G.S Pillay Engineering College", "district": "Nagapattinam"},
    {"name": "Sembodai Rukumani College of Engineering", "district": "Nagapattinam"},
    {"name": "Sir Isaac Newton College of Engineering and Technology", "district": "Nagapattinam"},
    {"name": "Arifa Institute of Engineering and Technology", "district": "Nagapattinam"},
    {"name": "CK College of Engineering", "district": "Cuddalore"},
    {"name": "MRK Institute of Technology", "district": "Cuddalore"},
    {"name": "Dr.Navalar Nedunchezhiyan College of Engineering", "district": "Cuddalore"},
    {"name": "Krishnaswamy College of Engineering and Technology", "district": "Cuddalore"},
    {"name": "St.Anne College of Engineering and Technology", "district": "Cuddalore"},
    {"name": "Government College of Engineering, Salem", "district": "Salem"},
    {"name": "Alagappa Chettiar College of Engineering and Technology", "district": "Sivagangai"},
    {"name": "Alagappa College of Technology", "district": "Chennai"},
    {"name": "Annai Teresa College of Education", "district": "Sivagangai"},
    {"name": "Ayya Nadar Janaki Ammal College", "district": "Sivakasi"},
    {"name": "Bhajarang Engineering College", "district": "Thiruvallur"},
    {"name": "College of Agricultural Technology", "district": "Thoothukudi"},
    {"name": "Government Arts College, Karur", "district": "Karur"},
    {"name": "Indra Ganesan College of Engineering", "district": "Trichy"},
    {"name": "Film and Television Institute of Tamil Nadu", "district": "Chennai"},
    {"name": "ICAT Design & Media College", "district": "Chennai"},
]

def search_college_website(college_name):
    """Search for college official website using Google search"""
    search_query = f"{college_name} official website Tamil Nadu"
    search_url = f"https://www.google.com/search?q={requests.utils.quote(search_query)}"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    try:
        response = requests.get(search_url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extract first result link
        results = soup.find_all('a')
        for result in results:
            href = result.get('href', '')
            if href.startswith('/url?q='):
                url = href.split('/url?q=')[1].split('&')[0]
                if not url.startswith('http'):
                    continue
                return url
    except Exception as e:
        print(f"Error searching for {college_name}: {e}")
    
    return None

def check_alumni_platform(url):
    """Check if website has alumni platform"""
    if not url:
        return {"has_alumni": False, "alumni_details": "No website found"}
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=15)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Check page text for alumni keywords
        page_text = soup.get_text().lower()
        alumni_found = []
        
        for keyword in ALUMNI_KEYWORDS:
            if keyword in page_text:
                alumni_found.append(keyword)
        
        # Check navigation menus for alumni links
        nav_links = []
        for link in soup.find_all('a', href=True):
            link_text = link.get_text().lower()
            link_href = link['href'].lower()
            if any(keyword in link_text or keyword in link_href for keyword in ALUMNI_KEYWORDS):
                nav_links.append({
                    'text': link.get_text().strip(),
                    'url': urljoin(url, link['href'])
                })
        
        if alumni_found or nav_links:
            return {
                "has_alumni": True,
                "alumni_details": f"Found keywords: {', '.join(set(alumni_found))}",
                "alumni_links": nav_links[:5]  # Limit to first 5 links
            }
        else:
            return {
                "has_alumni": False,
                "alumni_details": "No alumni-related content found"
            }
            
    except Exception as e:
        return {
            "has_alumni": False,
            "alumni_details": f"Error accessing website: {str(e)}"
        }

def process_colleges():
    """Process all colleges and check for alumni platforms"""
    results = []
    
    print(f"Processing {len(COLLEGES)} colleges...")
    print("=" * 80)
    
    for i, college in enumerate(COLLEGES, 1):
        print(f"\n[{i}/{len(COLLEGES)}] Checking: {college['name']}")
        
        # Search for website
        website = search_college_website(college['name'])
        if website:
            print(f"  Website found: {website}")
        else:
            print(f"  No website found")
        
        # Check for alumni platform
        alumni_check = check_alumni_platform(website)
        
        result = {
            "name": college['name'],
            "district": college['district'],
            "website": website,
            "has_alumni_platform": alumni_check['has_alumni'],
            "alumni_details": alumni_check['alumni_details'],
            "alumni_links": alumni_check.get('alumni_links', [])
        }
        
        results.append(result)
        
        # Print result
        if alumni_check['has_alumni']:
            print(f"  ✓ Alumni platform found: {alumni_check['alumni_details']}")
        else:
            print(f"  ✗ No alumni platform: {alumni_check['alumni_details']}")
        
        # Rate limiting
        time.sleep(2)
    
    return results

def save_results(results):
    """Save results to CSV and JSON"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Save to CSV
    csv_file = f"tamil_nadu_colleges_alumni_check_{timestamp}.csv"
    with open(csv_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=[
            'name', 'district', 'website', 'has_alumni_platform', 
            'alumni_details', 'alumni_links'
        ])
        writer.writeheader()
        for result in results:
            writer.writerow({
                'name': result['name'],
                'district': result['district'],
                'website': result['website'] or 'N/A',
                'has_alumni_platform': 'Yes' if result['has_alumni_platform'] else 'No',
                'alumni_details': result['alumni_details'],
                'alumni_links': json.dumps(result['alumni_links']) if result['alumni_links'] else 'N/A'
            })
    
    # Save to JSON
    json_file = f"tamil_nadu_colleges_alumni_check_{timestamp}.json"
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"\n{'=' * 80}")
    print(f"Results saved to:")
    print(f"  - {csv_file}")
    print(f"  - {json_file}")
    
    # Print summary
    with_alumni = sum(1 for r in results if r['has_alumni_platform'])
    without_alumni = len(results) - with_alumni
    
    print(f"\n{'=' * 80}")
    print("SUMMARY")
    print(f"{'=' * 80}")
    print(f"Total colleges checked: {len(results)}")
    print(f"Colleges WITH alumni platform: {with_alumni}")
    print(f"Colleges WITHOUT alumni platform: {without_alumni}")
    print(f"{'=' * 80}")
    
    # List colleges without alumni platform
    print("\nColleges WITHOUT Alumni Platform:")
    print("-" * 80)
    for result in results:
        if not result['has_alumni_platform']:
            print(f"• {result['name']} ({result['district']})")
            if result['website']:
                print(f"  Website: {result['website']}")
            print(f"  Reason: {result['alumni_details']}")
            print()

if __name__ == "__main__":
    results = process_colleges()
    save_results(results)

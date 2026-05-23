#!/usr/bin/env python3
"""
Tamil Nadu College Alumni Platform Checker - Version 2
Uses known website patterns and direct URL checking
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

# College data with known website URLs
COLLEGES = [
    # Chennai
    {"name": "PSG College of Technology", "district": "Coimbatore", "website": "https://psgtech.edu"},
    {"name": "Coimbatore Institute of Technology", "district": "Coimbatore", "website": "https://cit.edu"},
    {"name": "Government College of Technology, Coimbatore", "district": "Coimbatore", "website": "https://gct.ac.in"},
    {"name": "Kumaraguru College of Technology", "district": "Coimbatore", "website": "https://kct.ac.in"},
    {"name": "Sri Ramakrishna Engineering College", "district": "Coimbatore", "website": "https://srec.ac.in"},
    {"name": "Karpagam College of Engineering", "district": "Coimbatore", "website": "https://kce.ac.in"},
    {"name": "Sri Krishna College of Engineering & Technology", "district": "Coimbatore", "website": "https://skcet.ac.in"},
    {"name": "SNS College of Technology", "district": "Coimbatore", "website": "https://snscollege.ac.in"},
    {"name": "KPR Institute of Engineering and Technology", "district": "Coimbatore", "website": "https://kpriet.ac.in"},
    {"name": "Dr. Mahalingam College of Engineering and Technology", "district": "Coimbatore", "website": "https://mcet.in"},
    {"name": "Rathinam Technical Campus", "district": "Coimbatore", "website": "https://rathinamtechnicalcampus.com"},
    
    {"name": "Thiagarajar College of Engineering", "district": "Madurai", "website": "https://tce.edu"},
    {"name": "Kamaraj College of Engineering and Technology", "district": "Madurai", "website": "https://kamarajengg.edu"},
    {"name": "Solamalai College of Engineering", "district": "Madurai", "website": "https://solamalai.edu"},
    {"name": "Vaigai College of Engineering", "district": "Madurai", "website": "https://vaigaicollege.edu"},
    {"name": "KLN College of Information Technology", "district": "Madurai", "website": "https://klnce.edu"},
    
    {"name": "Kongu Engineering College", "district": "Erode", "website": "https://kongu.edu"},
    {"name": "Bannari Amman Institute of Technology", "district": "Erode", "website": "https://bitsathy.ac.in"},
    {"name": "Erode Sengunthar Engineering College", "district": "Erode", "website": "https://erodesengunthar.ac.in"},
    {"name": "Velalar College of Engineering and Technology", "district": "Erode", "website": "https://vcet.ac.in"},
    {"name": "Institute of Road and Transport Technology", "district": "Erode", "website": "https://irtt.ac.in"},
    
    {"name": "Sri Sivasubramaniya Nadar College of Engineering", "district": "Chennai", "website": "https://ssn.edu.in"},
    {"name": "Sri Sai Ram Engineering College", "district": "Chennai", "website": "https://sairam.edu.in"},
    {"name": "Easwari Engineering College", "district": "Chennai", "website": "https://easwariengg.com"},
    {"name": "Jerusalem College of Engineering", "district": "Chennai", "website": "https://jerusalemengg.ac.in"},
    {"name": "Hindustan Institute of Technology and Science", "district": "Chennai", "website": "https://hindustanuniv.ac.in"},
    {"name": "Ethiraj College for Women", "district": "Chennai", "website": "https://ethirajcollege.edu.in"},
    {"name": "A.M. Jain College", "district": "Chennai", "website": "https://amjaincollege.edu"},
    {"name": "Dr.MGR Janaki College of Arts and Science for Women", "district": "Chennai", "website": "https://drmgrjanakicollege.edu.in"},
    {"name": "Chennai Institute of Technology", "district": "Chennai", "website": "https://citchennai.edu.in"},
    {"name": "Indian Institute of Information Technology Design & Manufacturing Kancheepuram", "district": "Chennai", "website": "https://iiitdm.ac.in"},
    
    {"name": "M.Kumarasamy College of Engineering", "district": "Karur", "website": "https://mkce.edu.in"},
    {"name": "Government College of Engineering, Bargur", "district": "Krishnagiri", "website": "https://gcebargur.ac.in"},
    {"name": "Government College of Engineering, Salem", "district": "Salem", "website": "https://gcesalem.edu.in"},
    {"name": "Government College of Technology, Coimbatore", "district": "Coimbatore", "website": "https://gct.ac.in"},
    
    {"name": "Alagappa Chettiar College of Engineering and Technology", "district": "Karaikudi", "website": "https://accet.edu.in"},
    {"name": "Alagappa College of Technology", "district": "Chennai", "website": "https://annauniv.edu/act"},
    
    {"name": "Arunachala College Of Engineering For Women", "district": "Kanniyakumari", "website": "https://arunachala.edu.in"},
    {"name": "Ayya Nadar Janaki Ammal College", "district": "Sivakasi", "website": "https://ayyajankiammal.edu.in"},
    
    {"name": "A.V.C College of Engineering", "district": "Mayiladuthurai", "website": "https://avcengg.edu.in"},
    {"name": "E.G.S Pillay Engineering College", "district": "Nagapattinam", "website": "https://egspillay.edu.in"},
    
    {"name": "R.M.K. Engineering College", "district": "Chennai", "website": "https://rmkec.ac.in"},
    {"name": "Bhajarang Engineering College", "district": "Thiruvallur", "website": "https://bhajarangengg.com"},
    {"name": "Thangavelu Engineering College", "district": "Kanchipuram", "website": "https://tengg.edu.in"},
    {"name": "Kings Engineering College", "district": "Kanchipuram", "website": "https://kingsedu.ac.in"},
    {"name": "Adhiparasakthi Engineering College", "district": "Kanchipuram", "website": "https://adhiparasakthi.edu.in"},
    {"name": "Mohamed Sathak AJ College of Engineering", "district": "Chennai", "website": "https://msajce.edu.in"},
    
    {"name": "Selvam College of Technology", "district": "Namakkal", "website": "https://selvamcollege.edu.in"},
    {"name": "J.K.K.Nattraja College of Engineering and Technology", "district": "Namakkal", "website": "https://jkknat.edu.in"},
    {"name": "Sengunthar Engineering College", "district": "Namakkal", "website": "https://sengunthar.edu.in"},
    
    {"name": "CK College of Engineering", "district": "Cuddalore", "website": "https://ckcuddalore.edu.in"},
    {"name": "MRK Institute of Technology", "district": "Cuddalore", "website": "https://mrkinstitute.edu.in"},
    {"name": "Dr.Navalar Nedunchezhiyan College of Engineering", "district": "Cuddalore", "website": "https://dnnce.edu.in"},
    
    {"name": "Film and Television Institute of Tamil Nadu", "district": "Chennai", "website": "https://ftitn.edu.in"},
    {"name": "ICAT Design & Media College", "district": "Chennai", "website": "https://icat.ac.in"},
    
    # Additional colleges with common domain patterns
    {"name": "Loyola-ICAM College of Engineering and Technology", "district": "Chennai", "website": "https://licet.ac.in"},
    {"name": "BSA Crescent Engineering College", "district": "Chennai", "website": "https://bsacrecent.edu.in"},
    {"name": "Sri Sairam Institute of Technology", "district": "Chennai", "website": "https://sairamit.edu.in"},
    {"name": "Jaya Group of Colleges", "district": "Chennai", "website": "https://jayagroup.edu.in"},
    {"name": "Kumaraguru College of Liberal Arts and Science", "district": "Coimbatore", "website": "https://kclas.in"},
    {"name": "Adithya Institute of Technology", "district": "Coimbatore", "website": "https://ait.edu.in"},
    {"name": "Velammal College of Engineering and Technology", "district": "Madurai", "website": "https://velammal.edu.in"},
    {"name": "P.T.R College of Engineering and Technology", "district": "Madurai", "website": "https://ptrcollege.edu.in"},
    {"name": "Fathima Michael College of Engineering and Technology", "district": "Madurai", "website": "https://fatimamichael.edu.in"},
    {"name": "Ultra College of Engineering and Technology", "district": "Madurai", "website": "https://ultracollege.edu.in"},
    {"name": "Chettinad College of Engineering and Technology", "district": "Karur", "website": "https://ccetkarur.edu.in"},
    {"name": "Sembodai Rukumani College of Engineering", "district": "Nagapattinam", "website": "https://srcengg.edu.in"},
    {"name": "Sir Isaac Newton College of Engineering and Technology", "district": "Nagapattinam", "website": "https://sincet.edu.in"},
    {"name": "Arifa Institute of Engineering and Technology", "district": "Nagapattinam", "website": "https://arifainstitute.edu.in"},
    {"name": "Krishnaswamy College of Engineering and Technology", "district": "Cuddalore", "website": "https://kcet.edu.in"},
    {"name": "St.Anne College of Engineering and Technology", "district": "Cuddalore", "website": "https://stannecollege.edu.in"},
    {"name": "Annai Teresa College of Education", "district": "Sivagangai", "website": "https://annaitheresa.edu.in"},
    {"name": "College of Agricultural Technology", "district": "Thoothukudi", "website": "https://cat.edu.in"},
    {"name": "Government Arts College, Karur", "district": "Karur", "website": "https://gackarur.edu.in"},
    {"name": "Indra Ganesan College of Engineering", "district": "Trichy", "website": "https://igce.edu.in"},
]

def check_alumni_platform(url):
    """Check if website has alumni platform"""
    if not url:
        return {"has_alumni": False, "alumni_details": "No website found"}
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=15, allow_redirects=True)
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
            link_text = link.get_text().lower().strip()
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
            
    except requests.exceptions.RequestException as e:
        return {
            "has_alumni": False,
            "alumni_details": f"Error accessing website: {str(e)}"
        }
    except Exception as e:
        return {
            "has_alumni": False,
            "alumni_details": f"Error: {str(e)}"
        }

def process_colleges():
    """Process all colleges and check for alumni platforms"""
    results = []
    
    print(f"Processing {len(COLLEGES)} colleges...")
    print("=" * 80)
    
    for i, college in enumerate(COLLEGES, 1):
        print(f"\n[{i}/{len(COLLEGES)}] Checking: {college['name']}")
        print(f"  Website: {college['website']}")
        
        # Check for alumni platform
        alumni_check = check_alumni_platform(college['website'])
        
        result = {
            "name": college['name'],
            "district": college['district'],
            "website": college['website'],
            "has_alumni_platform": alumni_check['has_alumni'],
            "alumni_details": alumni_check['alumni_details'],
            "alumni_links": alumni_check.get('alumni_links', [])
        }
        
        results.append(result)
        
        # Print result
        if alumni_check['has_alumni']:
            print(f"  ✓ Alumni platform found: {alumni_check['alumni_details']}")
            if alumni_check.get('alumni_links'):
                for link in alumni_check['alumni_links'][:3]:
                    print(f"    - {link['text']}: {link['url']}")
        else:
            print(f"  ✗ No alumni platform: {alumni_check['alumni_details']}")
        
        # Rate limiting
        time.sleep(1)
    
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
            print(f"  Website: {result['website']}")
            print(f"  Reason: {result['alumni_details']}")
            print()
    
    # List colleges with alumni platform
    print("\nColleges WITH Alumni Platform:")
    print("-" * 80)
    for result in results:
        if result['has_alumni_platform']:
            print(f"• {result['name']} ({result['district']})")
            print(f"  Website: {result['website']}")
            print(f"  Details: {result['alumni_details']}")
            if result['alumni_links']:
                print(f"  Links:")
                for link in result['alumni_links']:
                    print(f"    - {link['text']}: {link['url']}")
            print()

if __name__ == "__main__":
    results = process_colleges()
    save_results(results)

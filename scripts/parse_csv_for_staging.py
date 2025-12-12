#!/usr/bin/env python3
"""
Parse AMET User Profiles CSV and generate SQL INSERT statements for staging_profile_degrees table.
"""
import csv
import sys

def escape_sql(val):
    """Escape single quotes for SQL."""
    if val is None:
        return 'NULL'
    val = str(val).strip()
    if not val:
        return 'NULL'
    return "'" + val.replace("'", "''") + "'"

def parse_int(val):
    """Parse integer or return NULL."""
    if val is None:
        return 'NULL'
    val = str(val).strip()
    if not val:
        return 'NULL'
    try:
        return str(int(val))
    except ValueError:
        return 'NULL'

def main():
    csv_path = '/Users/ashwin/Downloads/AMET_User_Profiles_2025_12_01_06_31_56_621.csv'
    
    # Column indices (0-based):
    # 0: User ID
    # 6: Graduation Year
    # 7: Degree
    # 29: Department
    # 45: Degree Program
    # 63: Batch Year
    
    inserts = []
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)  # Skip header
        
        # Verify column positions
        print(f"-- Column 0: {header[0]}")  # User ID
        print(f"-- Column 6: {header[6]}")  # Graduation Year
        print(f"-- Column 7: {header[7]}")  # Degree
        print(f"-- Column 29: {header[29]}")  # Department
        print(f"-- Column 45: {header[45]}")  # Degree Program
        print(f"-- Column 63: {header[63]}")  # Batch Year
        print()
        
        for row in reader:
            if len(row) < 64:
                continue
            
            profile_id = row[0].strip()
            if not profile_id:
                continue
            
            raw_degree = row[7] if len(row) > 7 else ''
            raw_department = row[29] if len(row) > 29 else ''
            raw_degree_program = row[45] if len(row) > 45 else ''
            raw_graduation_year = row[6] if len(row) > 6 else ''
            raw_batch_year = row[63] if len(row) > 63 else ''
            
            insert = f"""INSERT INTO staging_profile_degrees (profile_id, raw_degree, raw_department, raw_degree_program, raw_graduation_year, raw_batch_year)
VALUES (
    {escape_sql(profile_id)}::uuid,
    {escape_sql(raw_degree)},
    {escape_sql(raw_department)},
    {escape_sql(raw_degree_program)},
    {parse_int(raw_graduation_year)},
    {parse_int(raw_batch_year)}
) ON CONFLICT (profile_id) DO UPDATE SET
    raw_degree = EXCLUDED.raw_degree,
    raw_department = EXCLUDED.raw_department,
    raw_degree_program = EXCLUDED.raw_degree_program,
    raw_graduation_year = EXCLUDED.raw_graduation_year,
    raw_batch_year = EXCLUDED.raw_batch_year,
    loaded_at = NOW();"""
            
            inserts.append(insert)
    
    print(f"-- Total rows: {len(inserts)}")
    print()
    print("BEGIN;")
    print()
    for ins in inserts:
        print(ins)
        print()
    print("COMMIT;")

if __name__ == '__main__':
    main()

#!/usr/bin/env python3
import re
from pathlib import Path

def fix_broken_regexes(file_path):
    """Fix broken regexes that end with backslash"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Pattern to find incomplete regex patterns ending with \
    # These are regexes that were broken by comment removal
    fixes = [
        (r'const colorUrl = \(url\) => import_picocolors\.default\.cyan\(url\.replace\(\/:?\(\\d\+\)\\', 
         'const colorUrl = (url) => import_picocolors.default.cyan(url.replace(/:(\d+)$/g, '),'),
        (r'const schemeRegex = \/\^\[\\w\+\.-\]\+:\\\/\\', 
         'const schemeRegex = /^[\\w+.-]+:\\/\\//;'),
        (r'const deepImportRE = \/\^\(\[\^@\]\[\^\/\]\*\)\\\/\|^\(@\[\^\/\]\+\\\/\[\^\/\]\+\)\\', 
         'const deepImportRE = /^([^@][^/]*)\\/|^(@[^/]+\\/[^/]+)\\//;'),
    ]
    
    # Find and fix lines with incomplete regexes
    lines = content.split('\n')
    new_lines = []
    
    for i, line in enumerate(lines):
        if re.search(r'\/\^.*\\\s*$', line):
            # This line ends with an incomplete regex
            if 'colorUrl' in line:
                new_lines.append('\tconst colorUrl = (url) => import_picocolors.default.cyan(url.replace(/:(\d+)$/g, \'\'));')
            elif 'schemeRegex' in line:
                new_lines.append('\tconst schemeRegex = /^[\\w+.-]+:\\/\\//;')
            elif 'deepImportRE' in line:
                new_lines.append('\tconst deepImportRE = /^([^@][^/]*)\\/|^(@[^/]+\\/[^/]+)\\//;')
            else:
                new_lines.append(line)
        else:
            new_lines.append(line)
    
    new_content = '\n'.join(new_lines)
    
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False

# Fix Vite node.js files
vite_files = [
    'c:\\xampp\\htdocs\\Nuestras_Artesanías\\node_modules\\vite\\dist\\node\\chunks\\logger.js',
    'c:\\xampp\\htdocs\\Nuestras_Artesanías\\node_modules\\vite\\dist\\node\\chunks\\node.js',
]

for file_path in vite_files:
    try:
        if Path(file_path).exists():
            if fix_broken_regexes(file_path):
                print(f'✓ Fixed {Path(file_path).name}')
            else:
                print(f'- No changes needed for {Path(file_path).name}')
    except Exception as e:
        print(f'✗ Error fixing {file_path}: {e}')

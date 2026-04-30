#!/usr/bin/env python3
import re
from pathlib import Path

def check_comments_in_file(file_path):
    """Check if a file has any comments"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    issues = []
    lines = content.split('\n')
    
    for i, line in enumerate(lines, 1):
        if '//' in line:
            in_string = False
            string_char = None
            j = 0
            while j < len(line):
                if line[j] in ['"', "'", '`'] and (j == 0 or line[j-1] != '\\'):
                    if not in_string:
                        in_string = True
                        string_char = line[j]
                    elif line[j] == string_char:
                        in_string = False
                elif not in_string and j < len(line) - 1 and line[j:j+2] == '//':
                    issues.append(f"Line {i}: Found // comment: {line.strip()[:60]}")
                    break
                j += 1
        
        if '/*' in line and '*/' not in line:
            issues.append(f"Line {i}: Found /* without matching */: {line.strip()[:60]}")
        
        if '{/*' in line:
            issues.append(f"Line {i}: Found JSX comment: {line.strip()[:60]}")
    
    return issues

# Check all source files
workspace_root = Path(r'c:\xampp\htdocs\Nuestras_Artesanías')
exclude_dirs = {'node_modules', 'dist', 'build', '.git', '.vscode'}

files_with_issues = {}

for pattern in ['*.js', '*.jsx']:
    for file_path in workspace_root.rglob(pattern):
        if not any(excluded in file_path.parts for excluded in exclude_dirs):
            issues = check_comments_in_file(file_path)
            if issues:
                rel_path = file_path.relative_to(workspace_root)
                files_with_issues[str(rel_path)] = issues

if files_with_issues:
    print("FILES WITH REMAINING COMMENTS:")
    for file_path, issues in sorted(files_with_issues.items()):
        print(f"\n{file_path}:")
        for issue in issues:
            print(f"  {issue}")
else:
    print("✓ All comments successfully removed from all source files!")
    print("✓ No single-line comments (//)")
    print("✓ No multi-line comments (/* ... */)")
    print("✓ No JSX comments ({/* ... */})")

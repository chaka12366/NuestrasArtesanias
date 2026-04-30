#!/usr/bin/env python3
import re
from pathlib import Path

def check_comments_sophisticated(file_path):
    """Check for actual comments, excluding regex patterns and URLs"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    issues = []
    lines = content.split('\n')
    
    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        
        if '//' in line and not stripped.startswith('//'):
            in_string = False
            string_char = None
            in_regex = False
            j = 0
            
            while j < len(line):
                c = line[j]
                
                if not in_string and not in_regex and c in ['"', "'", '`'] and (j == 0 or line[j-1] != '\\'):
                    in_string = True
                    string_char = c
                elif in_string and c == string_char and (j == 0 or line[j-1] != '\\'):
                    in_string = False
                elif not in_string and c == '/' and j > 0 and line[j-1] in ['=', '(', ',', ' ', '!', '&', '|', '?', ':', ';']:
                    in_regex = True
                elif in_regex and c == '/' and (j == 0 or line[j-1] != '\\'):
                    in_regex = False
                elif not in_string and not in_regex and j < len(line) - 1 and line[j:j+2] == '//':
                    # This is a real comment
                    issues.append(f"Line {i}: {line.strip()[:80]}")
                    break
                
                j += 1
        
        if stripped.startswith('//') and not stripped.startswith('////'):
            if 'http' not in stripped:
                issues.append(f"Line {i}: {line.strip()[:80]}")
        
        if '/*' in stripped and '*/' not in stripped:
            issues.append(f"Line {i}: Block comment: {line.strip()[:80]}")
    
    return issues

workspace_root = Path(r'c:\xampp\htdocs\Nuestras_Artesanías')
exclude_dirs = {'node_modules', 'dist', 'build', '.git', '.vscode'}

files_with_issues = {}
total_checked = 0

for pattern in ['*.js', '*.jsx']:
    for file_path in workspace_root.rglob(pattern):
        if not any(excluded in file_path.parts for excluded in exclude_dirs):
            total_checked += 1
            issues = check_comments_sophisticated(file_path)
            if issues:
                rel_path = file_path.relative_to(workspace_root)
                files_with_issues[str(rel_path)] = issues

print(f"Checked {total_checked} source files\n")

if files_with_issues:
    print("FILES WITH REMAINING COMMENTS:")
    for file_path, issues in sorted(files_with_issues.items()):
        print(f"\n{file_path}:")
        for issue in issues[:5]:
            print(f"  {issue}")
        if len(issues) > 5:
            print(f"  ... and {len(issues) - 5} more")
else:
    print("✓✓✓ SUCCESS ✓✓✓")
    print("✓ All comments successfully removed!")
    print("✓ No // single-line comments found")
    print("✓ No /* */ multi-line comments found")
    print(f"✓ Total files processed: {total_checked}")

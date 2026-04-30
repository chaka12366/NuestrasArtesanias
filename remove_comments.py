#!/usr/bin/env python3
import os
import re
from pathlib import Path

def remove_comments_from_js(content):
    """Remove comments from JavaScript/JSX content"""
    
    # Remove single-line comments
    # Process line by line, being careful with strings
    lines = content.split('\n')
    result = []
    i = 0
    in_multiline_comment = False
    
    while i < len(lines):
        line = lines[i]
        
        # Handle multiline comments
        if in_multiline_comment:
            if '*/' in line:
                idx = line.find('*/')
                line = line[idx + 2:]
                in_multiline_comment = False
                if line.strip():
                    result.append(line)
            else:
                i += 1
                continue
        
        # Check for multiline comment start
        if '/*' in line and '*/' not in line[line.find('/*'):]:
            idx = line.find('/*')
            line = line[:idx]
            in_multiline_comment = True
            if line.rstrip():
                result.append(line.rstrip())
            i += 1
            continue
        
        if '/*' in line and '*/' in line:
            # Comment on same line
            while '/*' in line:
                start = line.find('/*')
                end = line.find('*/', start)
                if end != -1:
                    line = line[:start] + line[end+2:]
                else:
                    break
        
        # Remove single-line comments (//)
        # Need to be careful not to remove // inside strings
        in_string = False
        string_char = None
        j = 0
        new_line = ''
        
        while j < len(line):
            # Check for string delimiters
            if line[j] in ['"', "'", '`'] and (j == 0 or line[j-1] != '\\'):
                if not in_string:
                    in_string = True
                    string_char = line[j]
                elif line[j] == string_char:
                    in_string = False
                new_line += line[j]
                j += 1
            elif not in_string and j < len(line) - 1 and line[j:j+2] == '//':
                # Found comment outside string
                break
            else:
                new_line += line[j]
                j += 1
        
        result.append(new_line.rstrip())
        i += 1
    
    # Remove JSX comments {/* ... */}
    output = '\n'.join(result)
    output = re.sub(r'\{\s*/\*.*?\*/\s*\}', '', output, flags=re.DOTALL)
    
    # Remove excessive blank lines
    output = re.sub(r'\n\n\n+', '\n\n', output)
    
    return output


def process_files():
    workspace_root = Path(r'c:\xampp\htdocs\Nuestras_Artesanías')
    
    # Find all JS/JSX files, but exclude node_modules, dist, build, etc.
    exclude_dirs = {'node_modules', 'dist', 'build', '.git', '.vscode'}
    
    js_files = []
    for pattern in ['*.js', '*.jsx']:
        for file_path in workspace_root.rglob(pattern):
            if not any(excluded in file_path.parts for excluded in exclude_dirs):
                js_files.append(file_path)
    
    print(f'Found {len(js_files)} source JavaScript files')
    
    processed = 0
    errors = 0
    
    for file_path in js_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                original_content = f.read()
            
            # Check if file has comments
            if '//' in original_content or '/*' in original_content:
                new_content = remove_comments_from_js(original_content)
                
                # Only write if changes were made
                if new_content.strip() != original_content.strip():
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    rel_path = file_path.relative_to(workspace_root)
                    print(f'✓ {rel_path}')
                    processed += 1
        except Exception as e:
            errors += 1
            rel_path = file_path.relative_to(workspace_root)
            print(f'✗ {rel_path}: {e}')
    
    print(f'\nProcessed {processed} files with {errors} errors')


if __name__ == '__main__':
    process_files()

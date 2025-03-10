import os
from pathlib import Path

def print_directory_structure(startpath):
    for root, dirs, files in os.walk(startpath):
        # Exclude the node_modules directory from traversal
        dirs[:] = [d for d in dirs if d != "node_modules"]
        level = root.replace(str(startpath), '').count(os.sep)
        indent = ' ' * 4 * level
        print(f'{indent}{os.path.basename(root)}/')
        subindent = ' ' * 4 * (level + 1)
        for f in files:
            print(f'{subindent}{f}')

if __name__ == "__main__":
    current_directory = Path.cwd()
    print(f"Directory structure of: {current_directory}")
    print_directory_structure(current_directory)

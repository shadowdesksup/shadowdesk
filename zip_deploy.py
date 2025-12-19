
import zipfile
import os

folder_path = 'wpp-worker'
output_path = 'wpp-worker-linux.zip'

if os.path.exists(output_path):
    os.remove(output_path)

print(f"Creating {output_path} from {folder_path}...")

with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(folder_path):
        for file in files:
            abs_path = os.path.join(root, file)
            # Create relative path
            rel_path = os.path.relpath(abs_path, folder_path)
            # Force forward slashes for Linux compatibility
            zip_name = os.path.join('wpp-worker', rel_path).replace(os.path.sep, '/')
            
            print(f"Adding: {zip_name}")
            zipf.write(abs_path, zip_name)

print("Done! Ready for SCP.")

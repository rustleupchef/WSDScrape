import os
import sys
import subprocess
import tiktoken

def scrape(directory_path, count):
    subprocess.run(["node", "script.js", "load", str(count)], cwd=directory_path, stdout=subprocess.DEVNULL, stdin=subprocess.DEVNULL)

def is_greater(desired: int, counted: tuple):
        return desired > counted[0] and desired > counted[-1]

def avg_diff(desired: int, counted: tuple):
    return (counted[0]/desired + counted[-1]/desired)/2

def delete_all_files(directory_path, exceptions = [".gitignore"]):
    for filename in os.listdir(directory_path):
        if filename in exceptions: continue
        os.remove(os.path.join(directory_path, filename))

def count_files(directory_path, exceptions = [".gitignore"]):
    return len([file for file in os.listdir(directory_path) if file not in exceptions])

def count_tokens_in_directory(directory_path, model="gpt-4o"):
    encoding = tiktoken.encoding_for_model(model)
    total_tokens = 0
    letters = 0
    
    for root, _, files in os.walk(directory_path):
        for file in files:
            file_path = os.path.join(root, file)
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()

                    letters += len("".join(content.split()))

                    tokens = encoding.encode(content)
                    total_tokens += len(tokens)
            except Exception as e:
                print(f"Could not read {file}: {e}")
                
    return total_tokens - 4, letters/4 - 3 # accounting for the .gitignore

def main(arguments = []):
    parent_dir = os.path.dirname(os.getcwd())
    output_dir = os.path.join(parent_dir, "output", "load")
    if not os.path.exists(output_dir):
        os.mkdir(output_dir)

    print(f"gpt_count, estimate : {count_tokens_in_directory(output_dir)}")
    
    if len(arguments) == 0: return
    goal_score = int(arguments[0])
    delete_all_files(output_dir)

    print(f"\n\n{'| Working to match your token count |'.center(20 + len('| Working to match your token count |'), '=')}\n\n")

    print("Test 1: Checking Lower Bound of Token Count")
    scrape(parent_dir, 0)
    lower = count_tokens_in_directory(output_dir)
    if not is_greater(goal_score, lower):
        print("❌ Level 2 Overload: your token count is far too small even for WOWI alone")
        return
    lower = count_files(output_dir)
    delete_all_files(output_dir)
    print("✅ Test 1 passed\n\n")

    print("Test 2: Checking Upper Bound of Token Count")
    scrape(parent_dir, 1000)
    upper = count_tokens_in_directory(output_dir)
    if is_greater(goal_score, upper):
        print("✅ Test 2 passed")
        return
    upper = count_files(output_dir)
    delete_all_files(output_dir)
    print("❌ Level 1 Overload: your token count is far too small for all videos\n\n")

    print("Test 3: beginning to truncate...")
    upper, lower = upper - lower, 0

    while True:
        middle = (upper + lower + .5)//2
        lower, upper, middle = int(lower), int(upper), int(middle)
        print(f"{lower=}\t{upper=}\t{middle=}")

        scrape(parent_dir, middle)
        point = count_tokens_in_directory(output_dir)
        print(f"gpt_count, estimate : {point}")
        diff = avg_diff(goal_score, point)
        print(f"diff={abs(1 - diff)}")

        if is_greater(goal_score, point):
            print("=>")
            if diff >= .95:
                print("✅ Test 3 passed")
                break
            lower = middle
            
            if upper - lower <= 1:
                print(f"❌ Test 3 failed: target diff unreachable | {diff=}\ttarget={.95}")
                break
        else:
            print("<=")
            upper = middle
        delete_all_files(output_dir)
        print("-" * 20)

if __name__ == "__main__":
    main(sys.argv[1:])
import os
import tiktoken

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
                
    return total_tokens, letters/4

def main():
    parent_dir = os.path.dirname(os.getcwd())
    output_dir = os.path.join(parent_dir, "output")

    print(f"gpt_count, estimate : {count_tokens_in_directory(output_dir)}")

    

if __name__ == "__main__":
    main()
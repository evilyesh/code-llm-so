# web-llm

Draft for a web-based LLM chat for developers. 


## To Start

1. Clone the repository:
```bash
git clone https://github.com/evilyesh/web-llm.git
cd web-llm
```
2. Create a virtual environment: 
```bash
python3 -m venv venv
```
3. Install: 
```bash
pip install aiohttp sqlite requests tree-sitter
```
4. Start the application: 
```bash
python3 main.py
```
5. Start local model
   - In config/settings.json need to set path to local llm with API like Openai API (example in settings.json for llama.cpp: http://127.0.0.1:8989/v1/chat/completions) 
   - I use llama.cpp server with llama-server -port 8989, for example start local llama.cpp model with web server interface:
```bash
/path_to_bin/llama-server --port 8989 -m /path_to_model/Qwen2.5-Coder-32B-Instruct-Q5_K_L.gguf -ngl 99 --n-predict -1 --ctx-size 12240 --threads 4 --no-mmap --temp 0.01 --top-k 10 --cache-type-k q8_0 --cache-type-v q8_0 --flash-attn
```
Llama.cpp https://github.com/ggerganov/llama.cpp

6. You can set additional models in config for thinking model and speach-to-text model whishper:
```json
{
   ...
   "whisper_address": "http://192.168.1.143:8889/inference",
   "think_model": "accounts/.../models/DeepSeek-R1-Distill-Qwen-7B",
   "think_model_address": "http://127.0.0.1:8990/v1/chat/completions"
}
```
The thinking model is a good help in solving problems. I use Coder-32b for write code and R1-14B for prepare plan.

7. Open your browser and navigate to [http://127.0.0.1:5002/](http://127.0.0.1:5001/).

### Usage

1. **Enter the path to the directory with files.**
2. **Enter included directories with files.**
3. **In the chat, use `./` to select files from the chosen directory and add a prompt.**
4. **For navigation through the directory, use `../` to go up one level and `./` to select a directory from the list to go down.**

The response from the model will be displayed in a diff manner with use monaco editor.

## TODO

- [x] fix user prompt insert in html - now <? ?> translates in html as comment
- [x] Load file content before send prompt... 
- [x] and before diff with model answer. (its differ if user edit file too)
- [x] Display files with the same name in different directories.
- [ ] Implement permissions control. (semi realised, model can't save files outside project directory)
- [x] Implement config select
- [ ] Put files drag and drop (need electron for this feature, may be in future)
- [x] make improve prompt button


- [x] Fix files list popup.
- [x] Make settings popup.
- [x] currently can't edit files with ``` in content
- [ ] set files encodings
- [x] save code blocks


- This project uses the aiohttp library, which is licensed under the Apache-2.0 license. https://github.com/aio-libs/aiohttp
- This project uses the sqlite library. https://github.com/sqlite/sqlite
- This project uses the requests library, which is licensed under the Apache-2.0 license. https://github.com/psf/requests
- This project uses the tree-sitter library, which is licensed under the MIT license. https://github.com/tree-sitter/tree-sitter



- This project uses and contain the part of minified Monaco editor for web browsers, which is licensed under the MIT license. Monaco Editor is included in the project as a local dependency for offline use without the need for an internet connection. https://github.com/microsoft/monaco-editor Copyright (c) Microsoft Corporation. All rights reserved. 

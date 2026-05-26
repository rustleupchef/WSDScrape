import { JSDOM } from "jsdom";
import TurndownService from "turndown";
import { writeFile, mkdir } from "node:fs/promises";
import { YoutubeTranscript } from "youtube-transcript";
import yts from "yt-search";
import path from "path";
import readline from "node:readline";


const turndownservice = new TurndownService();

const delay = (min = 2000, max = 5000) => {
	const ms = Math.floor(Math.random() * (max - min + 1)) + min;
	return new Promise(resolve => setTimeout(resolve, ms));
};

function removeCSSBlocks(text) {
	text = text.replace(/[#.\w][\w\s\-,:.#\[\]="*()>~+^$|]*\{[^}]*\}/g, '');
	text = text.replace(/@media[^{]*\{[^}]*\{[^}]*\}[^}]*\}/g, '');
	text = text.replace(/^.*#block-[^\n]*$/gm, '');
	text = text.replace(/(\s*@\s*\}\s*)+/g, '');
	text = text.replace(/\s*@\s*$/gm, '');
	text = text.replace(/\n{3,}/g, '\n\n').trim();
	return text;
}

function cleanQuestion(text) {
	text = text.replace(/^\d+\.\s*/, '');
	text = text.replace(/^["""'''`]+|["""'''`]+$/g, '').trim();
	text = text.replace(/[,\s]+$/, '').trim();
	text = text.replace(/^(Proposition|Opposition|Government|Prime Minister|Deputy|Whip):\s*/i, '');
	text = text.replace(/^["""'''`]*Google,\s*/i, '');
	text = text.replace(/^["""'''`]+/, '').trim();
	text = text.charAt(0).toUpperCase() + text.slice(1);
	return text.trim();
}

async function grabWOWIAnalysis() {
	const baseUrl = "https://www.worldofwordsinstitute.com";
	const url = `${baseUrl}/blog/category/Topic+Analyses`;

	const response = await fetch(url);
	const html = await response.text();

	const doc = new JSDOM(html).window.document;
	const blogItemSummary = doc.querySelectorAll(".blog-title");

	const links = [];
	blogItemSummary.forEach(element => {
		links.push(element.querySelector("a").href);
	});

	console.log(`Found ${links.length} link(s). Starting text extraction...\n`);
	for (const link of links) {
		console.log(`🔗 Processing: ${link}`);

		const pageResponse = await fetch(baseUrl + link);
		const pageHtml = await pageResponse.text();

		const dom = new JSDOM(pageHtml).window.document;
		let content = "";

		const textBoxes = dom.querySelectorAll(".sqs-text-block-container");
		for (let i = 0; i < textBoxes.length; i++) {
			const boxHtml = textBoxes[i].innerHTML;
			const markdown = turndownservice.turndown(boxHtml);
			content += markdown + "\n";
		}

		content = removeCSSBlocks(content);

		const filePath = path.join("output", "load", `${crypto.randomUUID()}.md`);
		await writeFile(filePath, content, "utf8");
		console.log(`✅ Saved content to: ${filePath}\n`);
	}
	console.log('🎉 Scraping task completed!');
}

async function scrapeDebateTranscripts(MAX_VIDEOS) {
	const SEARCH_QUERY = 'World Schools Debating Championship WSDC finals';

	console.log(`🔍 Searching YouTube for: "${SEARCH_QUERY}"...`);

	const searchResults = await yts(SEARCH_QUERY);
	const videos = searchResults.videos.splice(0, MAX_VIDEOS);

	if (videos.length === 0) {
		console.log('No videos found.');
		return;
	}

	console.log(` Found ${videos.length} videos. Starting transcript extraction...\n`);

	for (const video of videos) {
		console.log(`🎬 Processing: "${video.title}"`);
		console.log(`🔗 Link: ${video.url}`);

		try {
			const transcriptItems = await YoutubeTranscript.fetchTranscript(video.videoId);

			const fullText = transcriptItems
				.map(item => item.text)
				.join(' ')
				.replace(/&#39;/g, "'")
				.replace(/&quot;/g, '"');

			const filePath = path.join("output", "load", `${crypto.randomUUID()}.md`);

			await writeFile(filePath, fullText, 'utf-8');
			console.log(`✅ Saved transcript to: ${filePath}\n`);
		} catch (error) {
			console.log(`❌ Failed to save transcript because: ${error}\n`);
		}

	}

	console.log('🎉 Scraping task completed!');
}

async function generateQuestions(query, model) {
	const OLLAMA_BASE_URL = 'http://localhost:11434';
	const MODEL = model;
	const SYSTEM_INSTRUCTIONS = 'You are a question generator. Always respond with ONLY the questions, one per line. Do not use numbering, bullet points, or any prefix. Do not include explanations or additional text. Just the raw questions back to back.';

	try {
		const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				model: MODEL,
				prompt: query,
				stream: false,
			}),
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		const data = await response.json();

		return data.response;
	} catch (error) {
		console.error(`❌ Error querying Ollama: ${error.message}`);
		throw error;
	}
}

async function searchDuckDuckGo(query) {
	const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

	try {
		const response = await fetch(url, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
				'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
				'Accept-Language': 'en-US,en;q=0.5'
			}
		});

		if (!response.ok) {
			throw new Error(`DuckDuckGo responded with status: ${response.status}`);
		}

		const html = await response.text();
		const dom = new JSDOM(html).window.document;

		const links = dom.querySelectorAll("a");
		const hrefs = []

		for (const link of links) {
			hrefs.push(link.href);
		}

		return hrefs;
	} catch (error) {
		console.error(`❌ Custom search failed for "${query}":`, error.message);
		return [];
	}
}

function promptUser(question) {
	const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
	return new Promise(resolve => rl.question(question, answer => {
		rl.close();
		resolve(answer.trim());
	}));
}

async function getQuestions(motion) {
	const modeAnswer = await promptUser(
		'\n❓ How would you like to generate search questions?\n' +
		'   [1] Enter questions manually\n' +
		'   [2] Generate with LLM (Mistral)\n' +
		'Choice: '
	);

	if (modeAnswer === '1') {
		console.log('\n📝 Enter your questions one per line. Type an empty line when done:');
		const questions = [];
		while (true) {
			const line = await promptUser('  > ');
			if (line === '') break;
			questions.push(cleanQuestion(line));
		}
		if (questions.length === 0) {
			console.error('❌ No questions entered. Aborting.');
			process.exit(1);
		}
		return questions;
	}

	const query = "Generate one question for the proposition and opposition to ask google for a world-schools debate about the motion";
	while (true) {
		console.log('\n🤖 Generating questions with Mistral...');
		const response = await generateQuestions(`${query}: ${motion}`, "mistral");
		const questions = response
			.split("\n")
			.filter(line => line.trim() !== '')
			.map(line => cleanQuestion(line));

		console.log('\n📋 Generated questions:');
		questions.forEach((q, i) => console.log(`   ${i + 1}. ${q}`));

		const approval = await promptUser(
			'\n✅ Use these questions?\n' +
			'   [y] Yes, proceed\n' +
			'   [n] No, regenerate\n' +
			'   [e] Edit manually before proceeding\n' +
			'Choice: '
		);

		if (approval.toLowerCase() === 'y') {
			return questions;
		} else if (approval.toLowerCase() === 'e') {
			console.log('\n✏️  Edit each question (press Enter to keep as-is):');
			const edited = [];
			for (const q of questions) {
				const newQ = await promptUser(`  [${q}]\n  New text (or Enter to keep): `);
				edited.push(cleanQuestion(newQ !== '' ? newQ : q));
			}
			console.log('\n📋 Final questions:');
			edited.forEach((q, i) => console.log(`   ${i + 1}. ${q}`));
			return edited;
		}
		console.log('\n🔄 Regenerating...');
	}
}

async function webSearch(motion, MAX_RESULTS) {
	const questions = await getQuestions(motion);
	console.log('\n🔎 Proceeding with questions:', questions);

	for (const question of questions) {
		const searchResults = await searchDuckDuckGo(question);

		let counter = 0;
		for (const result of searchResults) {
			console.log(result);
			try {
				let response = await fetch(`https:${result}`);
				let html = await response.text();
				let markdown = removeCSSBlocks(await turndownservice.turndown(html)).trim();

				const prefix = 'window.parent.location.replace("';
				if (!markdown.startsWith(prefix))
					throw new Error("Is not a accessible page");


				const link = markdown.slice(prefix.length, -3);
				console.log(`🔗 Processing: ${link}`);

				response = await fetch(link);
				html = await response.text();
				markdown = removeCSSBlocks(await turndownservice.turndown(html));

				const filePath = path.join("output", "search", `${crypto.randomUUID()}.md`);
				await writeFile(filePath, markdown, "utf-8");
				console.log(`✅ Saved content to: ${filePath}\n`);

				counter++;
				if (counter >= MAX_RESULTS)
					break;

			} catch (error) {
				console.log(`❌ Couldn't download file because ${error}`);
			}
		}
	}
}


async function main() {
	const args = process.argv.slice(2);
	if (args.length <= 0) {
		console.error("Not enough arguments");
		return;
	}

	await mkdir(path.join(process.cwd(), "output"), { recursive: true });

	const mode = args[0];

	if (mode === "load") {
		await mkdir(path.join(process.cwd(), "output", mode), { recursive: true });
		let MAX_VIDEOS = args.length > 1 ? parseInt(args[1]) : 20;

		await grabWOWIAnalysis();
		await scrapeDebateTranscripts(MAX_VIDEOS);
	}

	if (mode === "search") {
		await mkdir(path.join(process.cwd(), "output", mode), { recursive: true });
		if (args.length <= 1) {
			console.error("You must enter in the motion entry");
			return;
		}
		let MAX_RESULTS = args.length > 2 ? parseInt(args[2]) : 10;

		await webSearch(args[1], MAX_RESULTS);
	}
}

main();
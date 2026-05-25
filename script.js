import { JSDOM } from "jsdom";
import TurndownService from "turndown";
import { writeFile } from "node:fs/promises";
import { YoutubeTranscript } from "youtube-transcript";
import yts from "yt-search";
import path from "path";

const turndownservice = new TurndownService();

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
        
        const filePath = "output/" + crypto.randomUUID() + ".md";
        await writeFile(filePath, content, "utf8");
        console.log(`✅ Saved transcript to: ${filePath}\n`);
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
    
            const filePath = path.join("output/", `${crypto.randomUUID()}.md`);
    
            await writeFile(filePath, fullText, 'utf-8');
            console.log(`✅ Saved transcript to: ${filePath}\n`);
        } catch (error) {
            console.log(`❌ Failed to save transcript because: ${error}\n`);
        }

    }

    console.log('🎉 Scraping task completed!');
}

async function main() {
    const args = process.argv.slice(2);
    let MAX_VIDEOS = 20;
    if (args.length > 0) {
        MAX_VIDEOS = parseInt(args[0]);
    }

    await grabWOWIAnalysis();
    await scrapeDebateTranscripts(MAX_VIDEOS);
}

main();
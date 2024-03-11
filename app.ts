import OpenAI from "openai";
import { FileObject, FileObjectsPage } from "openai/resources";
import {
    Assistant,
    AssistantsPage,
} from "openai/resources/beta/assistants/assistants";
import fs from "fs";
import { Constants } from "./constants";
import { Thread } from "openai/resources/beta/threads/threads";
import { ThreadMessage } from "openai/resources/beta/threads/messages/messages";
import { Run } from "openai/resources/beta/threads/runs/runs";

const openai: OpenAI = new OpenAI();

async function main() {
    console.log("Starting script...");

    const assistant: Assistant = await configureAssistant();

    console.log("Assistant created...");

    console.log("Creating run...");

    const thread: Thread = await openai.beta.threads.create();

    const message = await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        file_ids: [assistant.file_ids[0]],
        content:
            "Summarize the uploaded PDF. Give as much legal detail as you can in " +
            "outlining the parameters of the agreement",
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: assistant.id,
    });

    await waitForRunCompletion(thread.id, run.id);

    console.log("Run completed...");

    const messages = await openai.beta.threads.messages.list(thread.id);

    let messageData: ThreadMessage[] = messages.data;
    let messageContent = messageData[0].content[0];

    console.log("Response Message: " + messageContent);
}

async function configureAssistant(): Promise<Assistant> {
    console.log("Creating assistant...");

    const filesList: FileObjectsPage = await openai.files.list();
    let file: FileObject = {} as FileObject;

    for (const loadedFile of filesList.data) {
        if (loadedFile.purpose === "assistants") {
            console.log("File already exists. Skipping creation...");
            file = loadedFile;
        }
    }

    if (!file.id) {
        console.log("Creating file...");
        file = await openai.files.create({
            file: fs.createReadStream("pdf_files/PARTNERSHIP_AGREEMENT.pdf"),
            purpose: "assistants",
        });
    }

    const assistantList: AssistantsPage = await openai.beta.assistants.list();

    for (const assistant of assistantList.data) {
        if (assistant.name === Constants.ASSISTANT_NAME) {
            console.log("Assistant already exists. Skipping creation...");
            return assistant;
        }
    }

    const assistant: Assistant = await openai.beta.assistants.create({
        name: Constants.ASSISTANT_NAME,
        description: Constants.ASSISTANT_DESCRIPTION,
        model: "gpt-3.5-turbo",
        tools: [{ type: "retrieval" }],
        file_ids: [file.id],
    });

    console.log(assistant.id);

    return assistant;
}

async function waitForRunCompletion(threadId: string, runId: string) {
    let run: Run = await openai.beta.threads.runs.retrieve(threadId, runId);
    while (run.status === "in_progress") {
        await delay(1000); // Wait for 2 seconds
        run = await openai.beta.threads.runs.retrieve(threadId, runId);
        console.log(`Run status: ${run.status}`);
    }
}

function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

main();

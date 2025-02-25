import OpenAI from 'openai';

let openaiInstance: OpenAI | null = null;

function getOpenAIInstance() {
  if (!openaiInstance) {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not found in environment variables');
    }
    openaiInstance = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    });
  }
  return openaiInstance;
}

export function resetOpenAIConfig() {
  openaiInstance = null;
}

export async function createThread() {
  try {
    const openai = getOpenAIInstance();
    const thread = await openai.beta.threads.create();
    return thread;
  } catch (error) {
    console.error('Error creating thread:', error);
    throw error;
  }
}

export async function sendMessage(threadId: string, message: string) {
  try {
    const openai = getOpenAIInstance();
    const assistantId = import.meta.env.VITE_OPENAI_ASSISTANT_ID;
    const defaultModel = import.meta.env.VITE_OPENAI_DEFAULT_MODEL || 'gpt-4o-mini';

    if (!assistantId) {
      throw new Error('OpenAI Assistant ID not found in environment variables');
    }

    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: message
    });

    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
      model: defaultModel
    });

    // Poll for completion
    let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    }

    if (runStatus.status === 'completed') {
      const messages = await openai.beta.threads.messages.list(threadId);
      return messages.data[0].content[0].text.value;
    }

    throw new Error('Failed to get response from assistant');
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

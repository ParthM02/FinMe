import { pipeline } from '@xenova/transformers';

let sentimentPipeline = null;


export async function loadSentimentModel() {
    if (sentimentPipeline === null) {
        try {

            console.log('Loading sentiment analysis model...');
            sentimentPipeline = await pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst2-english');
            console.log('Sentiment analysis model loaded successfully.');
        } catch (error) {
            console.error('Error loading sentiment analysis model:', error);
            throw new Error("Could not load sentiment analysis model. Check network connection.");
        }
    }
    return true;
}

export async function analyzeFinancialHeadlineSentiment(headline) {
    if (!headline || headline.trim() === '') {
        console.warn('No headline provided for sentiment analysis.');
        return null;
    }

    if (sentimentPipeline === null) {
        try {
            await loadSentimentModel();
        } catch (error) {
            console.error('Error initializing sentiment analysis model:', error);
            return null;
        }
    }

    try {
        const result = await sentimentPipeline(headline);
        if (result && result.length > 0) {
            const { label, score } = result[0];
            return { label, score };
        } else {
            console.warn("Sentiment analysis returned no valid results for:", headline);
            return null;
        }
    } catch (error) {
        console.error("Error during sentiment analysis of headline:", headline, error);
        throw new Error("Sentiment analysis failed for the provided headline.");
    }
}
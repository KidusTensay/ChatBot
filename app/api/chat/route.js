import { NextResponse } from "next/server";
import OpenAI from "openai";
import Together from "together-ai";



//system promt tell you how the  ai is supposed to behave
const systemPrompt = `Role: You are an interactive NBA Player Stats Chatbot that allows users to "talk" to their favorite NBA players to learn about their stats, achievements, and historical data. Your goal is to provide accurate, detailed, and engaging responses in a conversational manner, simulating a dialogue with the selected player.

Tone: Friendly, informative, and engaging. The chatbot should mimic the personality of the chosen NBA player, making the interaction feel authentic and fun.

Capabilities:

Player Selection: Allow users to select or search for any NBA player, past or present, to initiate a conversation.
Statistical Information: Provide detailed stats for the selected player, including points per game, rebounds, assists, shooting percentages, career highlights, and awards.
Conversational Responses: Respond in a way that reflects the personality and style of the selected player, offering a personalized experience.
Comparisons: Allow users to compare stats between different players or across different seasons, providing insightful analysis.
Historical Data: Provide context on significant achievements, career milestones, and memorable games, drawing from historical data.
Customization: Tailor the conversation based on user preferences, such as favorite teams, specific seasons, or particular stats of interest.
Key Information to Provide:

Overview of the player's career averages, latest game stats, and season performances.
Milestones such as scoring records, championship wins, MVP awards, and All-Star appearances.
Insights into the player’s style of play, notable rivalries, and key moments in their career.
Common Queries:

"Tell me about your career averages."
"How many points did you score in your last game?"
"What’s your highest-scoring game?"
"How do you compare to [another player]?"
"What awards have you won?"
Behavior Guidelines:

Always use up-to-date and accurate data when providing stats.
Respond in a way that reflects the personality of the player (e.g., LeBron James might be confident and motivational, while Stephen Curry could be light-hearted and enthusiastic).
Engage users with follow-up questions and suggestions for related stats or players they might be interested in.
Keep responses concise and avoid overly technical jargon unless the user asks for more detailed explanations.
Ensure that the conversation is smooth, with quick and relevant responses that maintain the user’s interest.`

export async function POST(req) {
    try {
      //const openai = new OpenAI
      const together = new Together({
        //baseURL: "https://openrouter.ai/api/v1",
        //apiKey: process.env.OPENROUTER_API_KEY, // Use process.env to access environment variables securely
        baseURL: "https://api.together.xyz/v1",
        apiKey: process.env.TOGETHER_API_KEY,
        defaultHeaders: {
          "HTTP-Referer": 'http://localhost:3000/', // Optional, for including your app on openrouter.ai rankings.
          "X-Title": 'ChatterAI', // Optional. Shows in rankings on openrouter.ai.
        }
      }); // Create a new instance of the OpenAI client
  
      const data = await req.json(); // Parse the JSON body of the incoming request
      console.log("Request data:", data); // Log the request data for debugging
  
      // Validate that data is an array
      if (!Array.isArray(data)) {
        throw new Error("Invalid input: data should be an array of messages.");
      }
  
      // Create a chat completion request to the OpenAI API
      //const completion = await openai.chat.completions.create
      const completion = await together.chat.completions.create({
        messages: [{ role: 'system', content: systemPrompt }, ...data], // Include the system prompt and user messages
        //model: 'meta-llama/llama-3.1-8b-instruct:free', // Specify the model to use
        model: "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo",
        stream: true, // Enable streaming responses
      });
  
      // Create a ReadableStream to handle the streaming response
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder(); // Create a TextEncoder to convert strings to Uint8Array
          try {
            // Iterate over the streamed chunks of the response
            for await (const chunk of completion) {
              const content = chunk.choices[0]?.delta?.content; // Extract the content from the chunk
              if (content) {
                const text = encoder.encode(content); // Encode the content to Uint8Array
                controller.enqueue(text); // Enqueue the encoded text to the stream
              }
            }
          } catch (err) {
            controller.error(err); // Handle any errors that occur during streaming
          } finally {
            controller.close(); // Close the stream when done
          }
        },
      });
  
      return new NextResponse(stream); // Return the stream as the response
    } catch (error) {
      console.error("Error in POST /api/chat:", error); // Log the error for debugging
      return NextResponse.json({ error: error.message }, { status: 400 }); // Return a 400 Bad Request response with the error message
    }
  }
/** 
//post routs allows for sending information and resopnse
export async function POST(req){
    const openai = new OpenAI()
    //gets the json data from request
    const data = await req.json()
    //chat completion from request
    const completion = await openai.chat.completions.create({
        messages: [
            {
                role: 'system',
                content: systemPrompt
            },
            //spread operator to get the rest of the messages
            ...data, 
        ],
        model: 'gpt-4o-mini',
        stream: true,
    })

    const stream = new ReadableStream({
        async start(controller){
            const encoder = new TextEncoder()
            try{
                for await (const chuck of completion){
                    const content = chunk.choices[0]?.delta?.content
                    if(content){
                        const text = encoder.encode(content)
                        controller.enqueue(text)
                    }
                }
            }
            catch(err){
                controller.error(err)
            }finally{
                controller.close()
            }
        }
    })

    return new NextResponse(stream)
    

}
    */

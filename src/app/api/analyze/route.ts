import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { PageMetric } from "@/types/tracker";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const { metrics }: { metrics: PageMetric[] } = await req.json();

    if (!metrics || metrics.length === 0) {
      return NextResponse.json({ error: "No metrics provided" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are an expert Web Performance Engineer. 
      Analyze the following chronological Page Speed Insights data for the URL: ${metrics[0].url} (Device: ${metrics[0].device || 'unspecified'})
      
      CRITICAL: You MUST analyze ALL FOUR metrics: Performance, Accessibility, Best Practices, and SEO. Do not ignore any.
      
      Data points (from oldest to newest):
      ${metrics.map((m, i) => `${i + 1}. Date: ${m.timestamp}, Device: ${m.device}, Perf: ${m.performance}, Acc: ${m.accessibility}, BP: ${m.bestPractices}, SEO: ${m.seo}`).join("\n")}
      
      Identify trends (improving, declining, or stagnant) for each of the four categories, pinpoint regressions, and provide specific structural optimization advice.
      Format your response as a JSON object with the following fields:
      - trend: A brief summary of the performance trend.
      - optimizations: A list of 3-5 objects, each with 'area' (e.g., "Images", "Caching") and 'recommendation' (the specific advice).
      - summary: A 2-3 sentence overview of the current state.
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Attempt to parse JSON from response (handling potential markdown blocks)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      trend: "Unable to parse trend analysis",
      optimizations: ["Check network settings", "Optimize images"],
      summary: responseText
    };

    return NextResponse.json(analysis);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Analysis error:", error);
    return NextResponse.json({ error: "Failed to analyze metrics: " + error.message }, { status: 500 });
  }
}

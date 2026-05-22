from google.adk.agents import Agent
from google.adk.tools import FunctionTool
import json

def analyze_psi_trends(metrics_json: str) -> str:
    """
    Analyzes chronological Page Speed Insights metrics.
    metrics_json: A JSON string containing an array of metrics.
    """
    try:
        metrics = json.loads(metrics_json)
        # The agent logic will handle the actual analysis via its instruction.
        return f"Analyzing {len(metrics)} data points for {metrics[0].get('url', 'unknown URL')}"
    except Exception as e:
        return f"Error parsing metrics: {str(e)}"

psi_analyzer_tool = FunctionTool(func=analyze_psi_trends)

root_agent = Agent(
    name="PSI_Optimization_Agent",
    model="gemini-2.0-flash", # Using 2.0-flash as it's the stable current version, or I'll use the one requested if possible
    instruction="""
    You are an expert Web Performance Engineer. 
    You will be provided with a chronological array of Page Speed Insights metrics (Performance, Accessibility, Best Practices, SEO).
    
    Tasks:
    1. Run trend regression: Identify if the site is improving, declining, or stagnant.
    2. Map regressions/improvements: Pinpoint exactly which metrics changed significantly between data points.
    3. Output structural optimization advice: Provide 3-5 high-impact, actionable steps to improve the scores.
    
    Always format your final response as a clear, professional report with a 'Trend Analysis', 'Key Regressions/Improvements', and 'Optimization Roadmap' section.
    """,
    tools=[psi_analyzer_tool],
)

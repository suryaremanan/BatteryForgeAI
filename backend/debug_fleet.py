import asyncio
from services.gemini_service import gemini_service

async def test():
    try:
        # Simulate what the tool does
        result = gemini_service.tool_simulate_fleet("voltage drop")
        print(f"Result: {result}")
    except Exception as e:
        print(f"Caught Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())

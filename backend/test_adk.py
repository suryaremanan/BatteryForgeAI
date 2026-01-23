
import asyncio
import os
from dotenv import load_dotenv
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from battery_forge_agent.agent import root_agent

load_dotenv()

async def test():
    session_service = InMemorySessionService()
    runner = Runner(
        agent=root_agent,
        session_service=session_service,
        app_name="TestApp"
    )
    
    print("Starting run...")
    # Passing new_message as string often works in high-level ADK APIs if they handle coercion
    # If not, it will error and we will know the type
    try:
        gen = runner.run_async(
            user_id="user1",
            session_id="sess1",
            new_message="Hello"
        )
        async for event in gen:
            print(f"Event: {type(event)}")
            if hasattr(event, 'response'):
                print(f"Response: {event.response}")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())

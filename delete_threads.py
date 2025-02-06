import os
from dotenv import load_dotenv
import asyncio
import aiohttp
import json

async def delete_all_threads():
    # Load environment variables from .env file
    load_dotenv("backend/.env")
    
    # API endpoint
    api_url = "http://localhost:8000"
    
    async with aiohttp.ClientSession() as session:
        # Get all threads
        async with session.get(f"{api_url}/threads") as response:
            if response.status != 200:
                print(f"Failed to get threads: {response.status}")
                return
            
            threads = await response.json()
            
            # Delete each thread
            deleted_count = 0
            for thread in threads:
                async with session.delete(f"{api_url}/threads/{thread['id']}") as delete_response:
                    if delete_response.status == 200:
                        deleted_count += 1
                    else:
                        print(f"Failed to delete thread {thread['id']}: {delete_response.status}")
            
            print(f"Successfully deleted {deleted_count} threads")

if __name__ == "__main__":
    asyncio.run(delete_all_threads()) 
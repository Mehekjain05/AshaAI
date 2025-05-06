
## Setup and Installation

### Prerequisites

*   Python 3.9+ and `pip`
*   Node.js (LTS version recommended) and `npm` or `yarn`
*   MongoDB Instance (local or cloud like MongoDB Atlas)
*   Pinecone Account and API Key
*   Google Cloud Project with Generative AI API enabled and API Key
*   Tavily AI API Key
*   RapidAPI Account and Key (Optional, if using `api/fetch.py` with JSearch)
*   Chrome and ChromeDriver (for Selenium scraping in `api/scraper.py`)

### Backend Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd AshaAI/backend
    ```
2.  **Create and activate a virtual environment:**
    ```bash
    python -m venv venv
    # On Windows
    venv\Scripts\activate
    # On macOS/Linux
    source venv/bin/activate
    ```
3.  **Install Python dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
4.  **Set up Environment Variables:**
    *   Create a `.env` file in the `backend` directory.
    *   Copy the contents of `.env.example` (if provided) or add the following variables, replacing the placeholder values with your actual credentials:
        ```dotenv
        # Flask
        SECRET_KEY=your_flask_secret_key

        # Google Generative AI
        GOOGLE_API_KEY=your_google_api_key

        # Pinecone
        PINECONE_API_KEY=your_pinecone_api_key
        PINECONE_ENV=your_pinecone_environment # e.g., us-east-1

        # MongoDB
        MONGODB_URI=your_mongodb_connection_string

        # Tavily Search
        TAVILY_API_KEY=your_tavily_api_key

        # Optional: RapidAPI (if using JSearch in api/fetch.py)
        RAPIDAPI_KEY=your_rapidapi_key
        ```
5.  **Run the backend server:**
    ```bash
    python app.py
    ```
    The backend server should now be running on `http://127.0.0.1:5000`.

### Frontend Setup

1.  **Navigate to the frontend directory:**
    ```bash
    cd ../frontend
    ```
2.  **Install Node dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```
3.  **Run the frontend development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    The frontend development server should now be running on `http://localhost:4000`.

## Running the Application

1.  Start the backend server (`cd backend && python app.py`).
2.  Start the frontend development server (`cd frontend && npm run dev`).
3.  Open your browser and navigate to `http://localhost:4000`.

## API Endpoints

*   `/users/chat`: (POST) Endpoint for sending user messages to the chatbot and receiving streaming responses.
*   `/admin/dashboard`: (GET) Endpoint to retrieve analytics data for the admin dashboard.

## Contributing

Contributions are welcome! Please follow standard fork-and-pull-request workflows. Ensure code is formatted and passes any linting checks.


FROM python:3.12.9-slim

# Set the working directory inside the container
WORKDIR /app

# Copy application files
COPY . /app

# Copy Stockfish binary and make it executable
COPY stockfish /app/stockfish
RUN chmod +x /app/stockfish

# Set environment variable for Stockfish path
ENV STOCKFISH_PATH="/app/stockfish"

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose FastAPI port
EXPOSE 8000

# Command to run FastAPI app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

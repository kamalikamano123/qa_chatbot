import time
from langchain_community.vectorstores import FAISS
from main import embeddings

# Load vector DB
vector_store = FAISS.load_local(
    "faiss_index",
    embeddings,
    allow_dangerous_deserialization=True
)

retriever = vector_store.as_retriever(
    search_type="mmr",
    search_kwargs={"k": 5, "fetch_k": 15}
)

# Test queries
test_queries = [
    {
        "query": "Explain neural network",
        "expected": ["neural"]
    },
    {
        "query": "What is machine learning?",
        "expected": ["machine learning"]
    },
    {
        "query": "What is PyTorch?",
        "expected": ["pytorch"]
    }
]

hits = 0
reciprocal_rank_sum = 0
precision_total = 0
latencies = []

for item in test_queries:
    query = item["query"]
    expected = item["expected"]

    start = time.time()
    docs = retriever.invoke(query)
    end = time.time()

    latency = end - start
    latencies.append(latency)

    relevant_count = 0
    found = False

    for rank, doc in enumerate(docs, start=1):
        text = doc.page_content.lower()

        if any(word in text for word in expected):
            relevant_count += 1

            if not found:
                hits += 1
                reciprocal_rank_sum += 1 / rank
                found = True

    precision = relevant_count / 5
    precision_total += precision

    print(f"\nQuery: {query}")
    print("Hit:", "Yes" if found else "No")
    print("Precision@5:", round(precision, 2))
    print("Latency:", round(latency, 3), "sec")

# Final Metrics
n = len(test_queries)

hit_rate = hits / n
mrr = reciprocal_rank_sum / n
avg_precision = precision_total / n
avg_latency = sum(latencies) / n

print("\n========== FINAL RESULTS ==========")
print("Hit Rate@5:", round(hit_rate, 2))
print("MRR:", round(mrr, 2))
print("Precision@5:", round(avg_precision, 2))
print("Average Latency:", round(avg_latency, 3), "sec")
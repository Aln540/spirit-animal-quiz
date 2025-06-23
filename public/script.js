const quizStart = document.getElementById('quiz-start');
const startBtn = document.getElementById('start-btn');
const quizContent = document.getElementById('quiz-content');
const quizResult = document.getElementById('quiz-result');

let conversationHistory = [];

startBtn.addEventListener('click', startQuiz);

async function startQuiz() {
    quizStart.classList.add('hidden');
    quizContent.classList.remove('hidden');
    quizContent.innerHTML = '<h2>Loading your first question...</h2>';
    
    // Initial call to the API to get the first question
    getNextStep();
}

async function getNextStep(userAnswer = null) {
    if (userAnswer) {
        // Add user's answer to history
        conversationHistory.push({
            role: "user",
            parts: [{ text: `My answer is: ${userAnswer}` }],
        });
    }

    try {
        const response = await fetch('/api/quiz', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ history: conversationHistory }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Add model's response to history
        conversationHistory.push({
            role: "model",
            parts: [{ text: JSON.stringify(data) }],
        });

        if (data.type === 'question') {
            displayQuestion(data);
        } else if (data.type === 'result') {
            displayResult(data);
        }
    } catch (error) {
        console.error('Error fetching next step:', error);
        quizContent.innerHTML = '<h2>Oops! Something went wrong. Please try refreshing the page.</h2>';
    }
}

function displayQuestion(questionData) {
    // Show start over option after the first question (when there's conversation history)
    const showStartOver = conversationHistory.length > 2; // 2 because we have user answer + model response
    
    quizContent.innerHTML = `
        <div class="fade-in">
            ${showStartOver ? '<div class="start-over-container"><button class="start-over-btn">← Start Over</button></div>' : ''}
            <h2>${questionData.text}</h2>
            <div class="options-grid">
                ${questionData.options.map(option => `
                    <button class="option-btn" data-answer="${option}">${option}</button>
                `).join('')}
            </div>
        </div>
    `;

    document.querySelectorAll('.option-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const selectedAnswer = e.target.getAttribute('data-answer');
            quizContent.innerHTML = '<h2>Thinking of the perfect next question...</h2>';
            getNextStep(selectedAnswer);
        });
    });

    // Add event listener for start over button if it exists
    const startOverBtn = document.querySelector('.start-over-btn');
    if (startOverBtn) {
        startOverBtn.addEventListener('click', () => {
            // Reset everything and go back to start
            conversationHistory = [];
            quizContent.classList.add('hidden');
            quizStart.classList.remove('hidden');
        });
    }
}

function displayResult(resultData) {
    quizContent.classList.add('hidden');
    quizResult.classList.remove('hidden');

    quizResult.innerHTML = `
        <div class="fade-in">
            <h2>Your Spirit Animal is...</h2>
            <h1>${resultData.animal}</h1>
            <p class="title">"${resultData.title}"</p>
            <p>${resultData.description}</p>
            <div class="result-buttons">
                <button class="share-btn">Share Result</button>
                <button class="retake-btn">Take Quiz Again</button>
            </div>
        </div>
    `;

    document.querySelector('.share-btn').addEventListener('click', () => {
        // Enhanced share functionality with better SEO
        const shareTitle = `My Spirit Animal is ${resultData.animal}!`;
        const shareText = `${resultData.share_text} Take the free spirit animal quiz at whatsyourspiritanimal.online`;
        const shareUrl = window.location.href;
        
        if (navigator.share) {
            navigator.share({
                title: shareTitle,
                text: shareText,
                url: shareUrl
            }).catch(console.error);
        } else {
            // Improved fallback for desktop with copy to clipboard
            const textToCopy = `${shareText} ${shareUrl}`;
            if (navigator.clipboard) {
                navigator.clipboard.writeText(textToCopy).then(() => {
                    alert("Share text copied to clipboard! Paste it anywhere to share your result.");
                });
            } else {
                alert(`Share this result with your friends!\n\n${textToCopy}`);
            }
        }
    });

    document.querySelector('.retake-btn').addEventListener('click', () => {
        // Reset everything and go back to start
        conversationHistory = [];
        quizResult.classList.add('hidden');
        quizStart.classList.remove('hidden');
    });
} 
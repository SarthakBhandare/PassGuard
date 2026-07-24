# PassGuard — Password Strength Checker

PassGuard is a sleek, modern, and highly responsive web application designed to evaluate the strength and security of passwords in real-time. It provides instant visual feedback, entropy calculation, and checks against known data breaches to ensure maximum password security.

## 🚀 Features

*   **Real-Time Scoring:** Dynamically calculates a password score based on length, character variety (uppercase, lowercase, numbers, symbols), and bonuses for length.
*   **Visual Strength Meter:** An animated progress bar and color-coded badges (Weak, Fair, Good, Strong) give instant feedback.
*   **Data Breach Detection:** Integrates with the [Have I Been Pwned API](https://haveibeenpwned.com/API/v3) using a privacy-preserving k-Anonymity model (only the first 5 characters of the SHA-1 hash are sent).
*   **Common Password Filter:** Instantly cross-references input against a built-in list of over 60 highly common and vulnerable passwords.
*   **Advanced Metrics:** Calculates and displays password entropy (in bits) and estimates the time required to crack the password (from "Instantly" to "Heat death of the universe+").
*   **Premium UI/UX:** Built with a modern dark theme, glassmorphism effects, smooth animations, and a fully responsive design for seamless mobile use.

## 🛠️ Technology Stack

*   **HTML5:** Semantic structure and accessibility.
*   **CSS3:** Custom variables, flexbox/grid layouts, animations, and a modern aesthetic.
*   **Vanilla JavaScript (ES6+):** Core logic, debouncing, SHA-1 hashing (using Web Crypto API), and asynchronous API calls.
*   **Zero Dependencies:** No external libraries or frameworks are required.

## 🚀 Getting Started (Local Development)

Since PassGuard is built with purely static files (HTML, CSS, JS), getting it running locally is incredibly simple.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/SarthakBhandare/PassGuard.git
    cd PassGuard
    ```
2.  **Open in your browser:**
    Simply double-click the `index.html` file to open it in your default web browser, or use a local server like Live Server in VS Code for a better development experience.

## 🔒 Privacy & Security Note

PassGuard prioritizes user privacy. Passwords are **never** stored, logged, or sent in plain text to any server.

*   The breach check utilizes the **k-Anonymity model**. The password is first hashed using SHA-1 locally in your browser. Only the first 5 characters of that hash are sent to the Have I Been Pwned API. The API returns a list of hashes matching that prefix, and the final matching is done locally.

## 📄 License

This project is open-source.

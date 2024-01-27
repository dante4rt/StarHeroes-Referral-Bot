# StarHeroes-Referral-Bot

This repository contains the code for a Node.js script that automates the process of creating referrals for a specified link using Puppeteer. The script interacts with web forms by automating a browser session, filling in usernames and emails for the referral process.

## Features

- Automated form filling with randomly generated usernames and emails.
- Customizable target URL input via command line.
- Delay implementations to mimic human interactions and reduce spam flagging.

## Prerequisites

Before running this script, make sure you have Node.js installed on your machine. Additionally, the following Node.js packages are required:
- `puppeteer` for browser automation.
- `random-names-places` for generating random usernames.
- `random-email` for generating random email addresses.
- `readline-sync` for command line input.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/dante4rt/StarHeroes-Referral-Bot.git
   ```
2. Navigate to the project directory:
   ```bash
   cd StarHeroes-Referral-Bot
   ```
3. Install the required packages:
   ```bash
   npm install
   ```

## Usage

To run the script, use the following command in the terminal:
```bash
node index.js
```
When prompted, enter the target URL for which you wish to create referrals.

## Disclaimer

This script is intended for educational purposes only. Automated web interactions can be against the terms of service of some websites. Use this script responsibly and ethically. We do not endorse or encourage any activity that violates the terms of service of any website.

## Contributions

Contributions to this project are welcome. Please feel free to fork the repository, make your changes, and create a pull request.

---

Developed by [dante4rt](https://github.com/dante4rt)

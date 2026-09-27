'use strict';

/**
 * Генерация хеша пароля администратора (npm run hash-password).
 *
 * В .env можно хранить как открытый пароль (ADMIN_PASSWORD=...),
 * так и scrypt-хеш (ADMIN_PASSWORD=scrypt$salt$hash). Второй вариант
 * безопаснее: утечка .env не раскрывает пароль напрямую.
 */

const readline = require('node:readline');
const session = require('../src/lib/session');

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

(async () => {
  const arg = process.argv.slice(2).find((a) => !a.startsWith('-'));
  const password = arg || (await ask('Введите пароль администратора: '));

  if (!password || password.length < 8) {
    console.error('Пароль должен содержать минимум 8 символов.');
    process.exit(1);
  }

  const hash = session.hashPassword(password);
  console.log('\nСкопируйте строку в .env:\n');
  console.log(`ADMIN_PASSWORD=${hash}`);
  console.log('\nПример проверки: node -e "console.log(require(\'./src/lib/session\').verifyPassword(process.argv[1]))" \'' + password + '\'');
})();

Перед тем как показывать работоспособность аминпанели нужно добавить админа через localstore (F12 - console - затем этот код :

users.push({ login: 'admin', password: 'admin123', role: 'admin' });
localStorage.setItem('users', JSON.stringify(users));



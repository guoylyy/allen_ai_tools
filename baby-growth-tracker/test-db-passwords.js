const mysql = require('mysql2/promise');

async function testPasswords() {
    const passwords = ['', 'root', 'password', '123456', 'mysql', 'admin'];
    
    for (const pwd of passwords) {
        try {
            console.log(`\n尝试密码："${pwd || '(空)'}"...`);
            
            const connection = await mysql.createConnection({
                host: '127.0.0.1',
                user: 'root',
                password: pwd,
                port: 3306
            });
            
            console.log(`✅ 成功！密码是："${pwd || '(空)'}"`);
            
            const [rows] = await connection.query('SELECT VERSION()');
            console.log('MySQL 版本:', rows[0]['VERSION()']);
            
            await connection.end();
            return pwd;
            
        } catch (error) {
            console.log(`❌ 失败：${error.message.split(':')[0]}`);
        }
    }
    
    console.log('\n❌ 所有常见密码都失败了');
    console.log('\n请提供您的 MySQL 密码，或者检查 Docker 容器的环境变量：');
    console.log('docker ps  # 查看容器');
    console.log('docker inspect <容器 ID> | grep MYSQL_ROOT_PASSWORD');
    
    return null;
}

testPasswords();

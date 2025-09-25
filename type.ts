import * as readlineSync from 'readline-sync';
import { Database } from 'sqlite3';
import { open } from 'sqlite';

type Usuario = {
  nome: string;
  idade: number;
  genero: 'Masculino' | 'Feminino' | 'NaoInformado';
};

async function setupDatabase() {
  const db = await open({
    filename: './database.sqlite',
    driver: Database,
  });

  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      idade INTEGER NOT NULL,
      genero TEXT CHECK(genero IN ('Masculino', 'Feminino', 'NaoInformado')) NOT NULL
    );
  `;

  try {
    await db.exec(createTableQuery + ``);
    console.log('Banco de dados e tabela configurados com sucesso!');
    return db;
  } catch (err) {
    console.error('Erro ao criar a tabela:', err);
    throw err;
  }
}

async function main() {
  try {
    const db = await setupDatabase();

    let op = 0;
    console.log('Bem-vindo ao sistema');

    do {
      op = readlineSync.questionInt(
        'Digite a opcao que deseja\n' +
          '0 - Sair\n' +
          '1 - Cadastrar Usuario\n' +
          '2 - Listar usuarios\n' +
          '3 - Deletar Usuario\n' +
          '4 - Alterar dados Usuario\n'
      );

      switch (op) {
        case 0:
          console.log('Saindo do programa...');
          await db.close();
          break;
        case 1:
          await cadastrarUsuario(db);
          break;
        case 2:
          await listarUsuarios(db);
          break;
        case 3:
          await excluirUsuario(db);
          break;
        case 4:
          await modificarUsuario(db);
          break;
        default:
          console.log('Opção inválida.');
      }
    } while (op !== 0);
  } catch (err) {
    console.error('Um erro crítico ocorreu:', err);
  }
}
main();
async function listarUsuarios(db: any) {
  const selectQuery = `SELECT * FROM usuarios;`;

  try {
    const usuarios = await db.all(selectQuery);

    if (Array.isArray(usuarios) && usuarios.length > 0) {
      console.log('\n--- LISTA DE USUÁRIOS ---');
      usuarios.forEach((user: any) => {
        console.log(
          `ID: ${user.id} | Nome: ${user.nome} | Idade: ${user.idade} | Gênero: ${user.genero}`
        );
      });
    } else {
      console.log('Nenhum usuário cadastrado.');
    }
  } catch (err) {
    console.error('Erro ao listar usuários:', err);
  }
}

async function cadastrarUsuario(db: any) {
  const usuario: Usuario = {} as Usuario;
  usuario.nome = readlineSync.question('digite o nome de usuario:\n');
  const nomeExiste = await nomeJaExiste(db, usuario.nome);
  if (nomeExiste) {
    console.log(`ERRO: nome de usuario ja cadastrado. `);
  } else {
    usuario.idade = readlineSync.questionInt('digite a idade do usuário\n');
    let generoInput = readlineSync.question(
      'digite o genero do usuario: F - feminino| M - masculino\n'
    );
    usuario.genero = 'NaoInformado';

    if (generoInput.toUpperCase() === 'M') {
      usuario.genero = 'Masculino';
    }

    if (generoInput.toUpperCase() === 'F') {
      usuario.genero = 'Feminino';
    }
    const insertQuery = `
        INSERT INTO usuarios (nome, idade, genero)
        VALUES (?, ?, ?);
        `;
    try {
      await db.run(insertQuery, [usuario.nome, usuario.idade, usuario.genero]);
      console.log(`Usuário "${usuario.nome}" cadastrado com sucesso!`);
    } catch (err) {
      console.error('Erro ao cadastrar usuário:', err);
    }
  }
}

async function nomeJaExiste(db: any, nome: string): Promise<boolean> {
  const selectQuery = `SELECT nome FROM usuarios WHERE nome = ?;`;

  try {
    const resultado = await db.get(selectQuery, [nome]);

    return resultado !== undefined;
  } catch (err) {
    console.error('Erro ao verificar nome no banco de dados:', err);
    return false;
  }
}

async function excluirUsuario(db: any) {
  const nomeExcluir = readlineSync.question(
    'Digite o nome de usuario que deseja excluir\n'
  );
  const deleteQuery = `DELETE FROM usuarios WHERE nome = ?`;
  try {
    const deleteResult = await db.run(deleteQuery, [nomeExcluir]);
    if (deleteResult.changes && deleteResult.changes > 0) {
      console.log(`Usuário "${nomeExcluir}" excluído com sucesso!`);
    } else {
      console.log(`Nenhum usuário encontrado com o nome "${nomeExcluir}".`);
    }
  } catch (err) {
    console.error('Erro ao excluir o usuario no banco de dados:', err);
  }
}

async function modificarUsuario(db: any) {
  try {
    const nomeModificar = readlineSync.question(
      'Digite o nome que deseja modificar as informacoes:\n'
    );
    const nomeExiste = await nomeJaExiste(db, nomeModificar);
    if (!nomeExiste) {
      console.log(`Usuario nao cadastrado.`);
    } else {
      let opModif = readlineSync.questionInt(
        'Digite a opcao que deseja\n' +
          '1 - Alterar Nome\n' +
          '2 - Alterar idade\n'
      );
      switch (opModif) {
        case 1:
          alterarNome(db, nomeModificar);
          break;
        case 2:
          alterarIdade(db, nomeModificar);
          break;
      }
    }
  } catch (err) {
    console.error('Erro ao encontrar nome no banco de dados:', err);
    return false;
  }
}

async function alterarNome(db: any, nome: string) {
  const novoNome = readlineSync.question('Digite o novo nome: ');
  const updateQuery = `UPDATE usuarios SET nome = ? WHERE nome = ?;`;
  try {
    const result = await db.run(updateQuery, [novoNome, nome]);
    if (result.changes && result.changes > 0) {
      console.log(`Nome alterado com sucesso para ${novoNome}!`);
    } else {
      console.log('Nenhum usuário encontrado para alterar.');
    }
  } catch (err) {
    console.error('Erro ao alterar o nome:', err);
  }
}

async function alterarIdade(db: any, nome: string) {
  const novaIdade = readlineSync.question('Digite a nova Idade: ');
  const updateQuery = `UPDATE usuarios SET idade = ? WHERE nome = ?;`;
  try {
    const result = await db.run(updateQuery, [novaIdade, nome]);
    if (result.changes && result.changes > 0) {
      console.log(`Idade alterada com sucesso para "${novaIdade}"!`);
    } else {
      console.log('Nenhum usuário encontrado para alterar.');
    }
  } catch (err) {
    console.error('Erro ao alterar o nome:', err);
  }
}

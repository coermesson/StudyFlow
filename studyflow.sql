CREATE DATABASE IF NOT EXISTS studyflow;
USE studyflow;

-- Tabela Usuario
CREATE TABLE Usuario (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  nome Varchar(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL
);

-- Tabela Curso
CREATE TABLE Curso (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  nome VARCHAR(255) NOT NULL,
  usuarioId VARCHAR(36) NOT NULL,
  FOREIGN KEY (usuarioId) REFERENCES Usuario(id) ON DELETE CASCADE
);

-- Tabela Materia
CREATE TABLE Materia (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  nome VARCHAR(255) NOT NULL,
  cursoId VARCHAR(36) NOT NULL,
  FOREIGN KEY (cursoId) REFERENCES Curso(id) ON DELETE CASCADE
);

-- Tabela QuadroKanban
CREATE TABLE QuadroKanban (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  nome VARCHAR(255) NOT NULL,
  materiaId VARCHAR(36) NOT NULL,
  FOREIGN KEY (materiaId) REFERENCES Materia(id) ON DELETE CASCADE
);

-- Tabela TarefaKanban
CREATE TABLE TarefaKanban (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT NOT NULL,
  status ENUM('a fazer', 'fazendo', 'feito') NOT NULL,
  prioridade ENUM('baixa', 'média', 'alta') NOT NULL,
  quadroId VARCHAR(36) NOT NULL,
  FOREIGN KEY (quadroId) REFERENCES QuadroKanban(id) ON DELETE CASCADE
);

-- Tabela ListaToDo
CREATE TABLE ListaToDo (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  nome VARCHAR(255) NOT NULL,
  materiaId VARCHAR(36) NOT NULL,
  FOREIGN KEY (materiaId) REFERENCES Materia(id) ON DELETE CASCADE
);

-- Tabela ItemToDo
CREATE TABLE ItemToDo (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  descricao TEXT NOT NULL,
  feito BOOLEAN NOT NULL DEFAULT FALSE,
  listaId VARCHAR(36) NOT NULL,
  FOREIGN KEY (listaId) REFERENCES ListaToDo(id) ON DELETE CASCADE
);

-- Tabela Arquivo
CREATE TABLE Arquivo (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  nome VARCHAR(255) NOT NULL,
  materiaId VARCHAR(36) NOT NULL,
  FOREIGN KEY (materiaId) REFERENCES Materia(id) ON DELETE CASCADE
);
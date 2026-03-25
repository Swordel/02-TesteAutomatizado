import { test, expect } from '@playwright/test';

test.describe('QS Acadêmico — Testes do Sistema de Notas', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://swordel.github.io/02-TesteAutomatizado/');
    //Verifica título da página
    await expect(page).toHaveTitle(/QS Acadêmico/);
  });


  // ========== GRUPO 1: Cadastro de Alunos ==========

  test.describe('Cadastro de Alunos', () => {

    test('deve exibir os placeholders corretos nos campos do formulário', async ({ page }) => {
      await expect(page.getByLabel('Nome do Aluno')).toHaveAttribute('placeholder', 'Digite o nome completo');
      await expect(page.getByLabel('Nota 1')).toHaveAttribute('placeholder', '0 a 10');
      await expect(page.getByLabel('Nota 2')).toHaveAttribute('placeholder', '0 a 10');
      await expect(page.getByLabel('Nota 3')).toHaveAttribute('placeholder', '0 a 10');
    });

    test('deve cadastrar um aluno com dados válidos', async ({ page }) => {
      //Check visibilidade da seção "Cadastro"
      await expect(page.locator('#secao-cadastro')).toBeVisible();

      await page.getByLabel('Nome do Aluno').fill('João Silva');
      await page.getByLabel('Nota 1').fill('7');
      await page.getByLabel('Nota 2').fill('8');
      await page.getByLabel('Nota 3').fill('6');

      await page.getByRole('button', { name: 'Cadastrar' }).click();

      // Verificar que o aluno aparece na tabela
      await expect(page.locator('#tabela-alunos tbody tr')).toHaveCount(1);
      await expect(page.locator('#tabela-alunos').getByText('João Silva')).toBeVisible();
      //Esse código original resolvia pra N elementos, então restringi o escopo: await expect(page.getByText('João Silva')).toBeVisible();
    });

    test('deve exibir mensagem de sucesso após cadastro', async ({ page }) => {
      await page.getByLabel('Nome do Aluno').fill('Ana Costa');
      await page.getByLabel('Nota 1').fill('9');
      await page.getByLabel('Nota 2').fill('8');
      await page.getByLabel('Nota 3').fill('10');

      await page.getByRole('button', { name: 'Cadastrar' }).click();

      await expect(page.locator('#mensagem')).toContainText('cadastrado com sucesso');
    });

    test('não deve cadastrar aluno sem nome', async ({ page }) => {
      await page.getByLabel('Nota 1').fill('7');
      await page.getByLabel('Nota 2').fill('8');
      await page.getByLabel('Nota 3').fill('6');

      await page.getByRole('button', { name: 'Cadastrar' }).click();

      // A tabela deve continuar sem dados reais
      await expect(page.locator('#tabela-alunos tbody td.texto-central')).toBeVisible();
    });

  });

  // ========== GRUPO 2: Cálculo de Média ==========

  test.describe('Cálculo de Média', () => {

    test('deve calcular a média aritmética das três notas', async ({ page }) => {
      await page.getByLabel('Nome do Aluno').fill('Pedro Santos');
      await page.getByLabel('Nota 1').fill('8');
      await page.getByLabel('Nota 2').fill('6');
      await page.getByLabel('Nota 3').fill('10');

      await page.getByRole('button', { name: 'Cadastrar' }).click();

      // Média esperada: (8 + 6 + 10) / 3 = 8.00
      const celulaMedia = page.locator('#tabela-alunos tbody tr').first().locator('td').nth(4);
      await expect(celulaMedia).toHaveText('8.00');
    });

  });

  // ========== GRUPO 3: 1) Teste de validação de notas ==========

  test.describe('Validação de Notas', () => {

    test('deve rejeitar nota maior que 10', async ({ page }) => {
      await page.getByLabel('Nome do Aluno').fill('Maior que dez');
      await page.getByLabel('Nota 1').fill('11');
      await page.getByLabel('Nota 2').fill('8');
      await page.getByLabel('Nota 3').fill('7');

      await page.getByRole('button', { name: 'Cadastrar' }).click();

      // Deve exibir mensagem de erro
      //Como o .js chama exibirMensagem('As notas devem estar entre 0 e 10.', 'erro'); -> peguei um trecho da msg pra validar
      await expect(page.locator('#mensagem')).toContainText('entre 0 e 10');

      // Aluno NÃO deve aparecer na tabela
      await expect(page.locator('#tabela-alunos').getByText('Nenhum aluno cadastrado.')).toBeVisible();
    });

    test('deve rejeitar nota menor que 0', async ({ page }) => {
      await page.getByLabel('Nome do Aluno').fill('Aluno negativo');
      await page.getByLabel('Nota 1').fill('7');
      await page.getByLabel('Nota 2').fill('2');
      await page.getByLabel('Nota 3').fill('-1');

      await page.getByRole('button', { name: 'Cadastrar' }).click();

      // Deve exibir mensagem de erro
      await expect(page.locator('#mensagem')).toContainText('entre 0 e 10');

      // Aluno NÃO deve aparecer na tabela
      await expect(page.locator('#tabela-alunos').getByText('Nenhum aluno cadastrado.')).toBeVisible();
    });

  });

  // ========== GRUPO 4: 2) Teste de busca por nome ==========

  test.describe('Busca por Nome', () => {

    test.beforeEach(async ({ page }) => { //testando o beforeEach :D
      // Cadastrar primeiro aluno
      await page.getByLabel('Nome do Aluno').fill('Gabriela Reis');
      await page.getByLabel('Nota 1').fill('8');
      await page.getByLabel('Nota 2').fill('7');
      await page.getByLabel('Nota 3').fill('9');
      await page.getByRole('button', { name: 'Cadastrar' }).click();

      // Cadastrar segundo aluno
      await page.getByLabel('Nome do Aluno').fill('Henrique Morato');
      await page.getByLabel('Nota 1').fill('5');
      await page.getByLabel('Nota 2').fill('4');
      await page.getByLabel('Nota 3').fill('6');
      await page.getByRole('button', { name: 'Cadastrar' }).click();

      // Garantir que os dois foram cadastrados antes de cada teste
      await expect(page.locator('#tabela-alunos tbody tr')).toHaveCount(2);
    });

    test('deve exibir apenas o aluno correspondente ao termo digitado', async ({ page }) => {

      // Digitar no campo de busca
      await page.getByLabel('Buscar por nome').fill('Gabriela');

      // Deve aparecer apenas 1 linha na tabela
      await expect(page.locator('#tabela-alunos tbody tr:visible')).toHaveCount(1);

      // Essa linha deve ser a Gaby
      await expect(page.locator('#tabela-alunos').getByText('Gabriela Reis')).toBeVisible();

      // o Adulto Responsável não deve estar visível
      await expect(page.locator('#tabela-alunos').getByText('Henrique Morato')).not.toBeVisible();

    });

    test('não deve ser case sensitive', async ({ page }) => {

      //Como no arquivo .js tem toLowerCase(), testei se realmente funciona com maiúscula e minúscula variadas
      await page.getByLabel('Buscar por nome').fill('GaBrIeLa');

      // Aparece a Gabriela, não aparece o Henrique e só tem 1 linha na tabela, afinal, só cadastrei uma Gabriela pra aparecer no filtro.
      await expect(page.locator('#tabela-alunos').getByText('Gabriela Reis')).toBeVisible();
      await expect(page.locator('#tabela-alunos').getByText('Henrique Morato')).not.toBeVisible();
      await expect(page.locator('#tabela-alunos tbody tr:visible')).toHaveCount(1);
    });

    test('deve restaurar todos os alunos ao limpar o filtro', async ({ page }) => {
      //Preenche o campo de busca
      await page.getByLabel('Buscar por nome').fill('Gabriela');
      await expect(page.locator('#tabela-alunos tbody tr:visible')).toHaveCount(1);

      // Limpando o campo de busca
      await page.getByLabel('Buscar por nome').clear();

      // Ambos os alunos devem reaparecer
      await expect(page.locator('#tabela-alunos').getByText('Gabriela Reis')).toBeVisible();
      await expect(page.locator('#tabela-alunos').getByText('Henrique Morato')).toBeVisible();

      // Aparece 2 linhas na tabela
      await expect(page.locator('#tabela-alunos tbody tr')).toHaveCount(2);
    });

    test('deve exibir a mensagem "Nenhum aluno cadastrado" caso não haja termo correspondente', async ({ page }) => {
      //Testando com o aluno "xuxuzinho" que não está cadastrado no sistema
      await page.getByLabel('Buscar por nome').fill('xuxuzinho');

      //Verifica que a mensagem aparece
      await expect(page.locator('#tabela-alunos').getByText('Nenhum aluno cadastrado.')).toBeVisible();

      //Confirma que os alunos sumiram
      await expect(page.locator('#tabela-alunos').getByText('Gabriela Reis')).not.toBeVisible();
      await expect(page.locator('#tabela-alunos').getByText('Henrique Morato')).not.toBeVisible();
    });

  });

  // ========== GRUPO 5: 3) Teste de Exclusão ==========

  test.describe('Exclusão de Alunos', () => {

    // Teste isolado: apenas 1 aluno
    test('deve excluir um aluno e deixar a tabela vazia', async ({ page }) => {
      await page.getByLabel('Nome do Aluno').fill('Belinha Silva');
      await page.getByLabel('Nota 1').fill('8');
      await page.getByLabel('Nota 2').fill('7');
      await page.getByLabel('Nota 3').fill('9');
      await page.getByRole('button', { name: 'Cadastrar' }).click();

      // Verificar que o aluno aparece na tabela/tá cadastrado
      await expect(page.locator('#tabela-alunos tbody tr')).toHaveCount(1);
      await expect(page.locator('#tabela-alunos').getByText('Belinha Silva')).toBeVisible();

      // Excluir a aluna Belinha Silva (única cadastrado neste contexto isolado)
      await page.getByRole('button', { name: 'Excluir Belinha Silva' }).click();

      // A tabela deve estar vazia
      await expect(page.locator('#tabela-alunos').getByText('Nenhum aluno cadastrado.')).toBeVisible();
    });


    // Demais testes: 2 alunos via beforeEach
    test.describe('Exclusão com dois alunos cadastrados', () => {

      test.beforeEach(async ({ page }) => {
        await page.getByLabel('Nome do Aluno').fill('Belinha Silva');
        await page.getByLabel('Nota 1').fill('8');
        await page.getByLabel('Nota 2').fill('7');
        await page.getByLabel('Nota 3').fill('9');
        await page.getByRole('button', { name: 'Cadastrar' }).click();

        await page.getByLabel('Nome do Aluno').fill('João das Neves');
        await page.getByLabel('Nota 1').fill('5');
        await page.getByLabel('Nota 2').fill('4');
        await page.getByLabel('Nota 3').fill('6');
        await page.getByRole('button', { name: 'Cadastrar' }).click();

        // Garantir que os dois foram cadastrados antes de cada teste
        await expect(page.locator('#tabela-alunos tbody tr')).toHaveCount(2);
      });

      test('deve excluir apenas um aluno e manter o outro', async ({ page }) => {

        // Excluir somente a Belinha
        await page.getByRole('button', { name: 'Excluir Belinha Silva' }).click();

        // Belinha não deve mais aparecer
        await expect(page.locator('#tabela-alunos').getByText('Belinha Silva')).not.toBeVisible();

        // João das Neves deve continuar na tabela
        await expect(page.locator('#tabela-alunos').getByText('João das Neves')).toBeVisible();

        // Deve restar apenas 1 linha
        await expect(page.locator('#tabela-alunos tbody tr')).toHaveCount(1);
      });


      test('deve limpar todos os alunos ao confirmar "Limpar Tudo"', async ({ page }) => {
        // Aceitar o diálogo de confirmação (equivale a clicar "OK")
        page.on('dialog', async dialog => {
          await dialog.accept();
        });
        await page.getByRole('button', { name: 'Limpar Tudo' }).click();

        // A tabela deve estar vazia
        await expect(page.locator('#tabela-alunos').getByText('Nenhum aluno cadastrado.')).toBeVisible();

        // Nenhum dos alunos deve aparecer
        await expect(page.locator('#tabela-alunos').getByText('Belinha Silva')).not.toBeVisible();
        await expect(page.locator('#tabela-alunos').getByText('João das Neves')).not.toBeVisible();
      });

      test('não deve limpar os alunos ao cancelar "Limpar Tudo"', async ({ page }) => {
        // Rejeitar o diálogo de confirmação (clicar "Cancelar")
        page.on('dialog', async dialog => {
          await dialog.dismiss();
        });
        await page.getByRole('button', { name: 'Limpar Tudo' }).click();

        // Ambos os alunos devem continuar na tabela
        await expect(page.locator('#tabela-alunos').getByText('Belinha Silva')).toBeVisible();
        await expect(page.locator('#tabela-alunos').getByText('João das Neves')).toBeVisible();
        await expect(page.locator('#tabela-alunos tbody tr')).toHaveCount(2);
      });

    });


  });

  // ========== GRUPO 6: 4) Teste de Estatísticas ==========

  test.describe('Estatísticas', () => {

    test.beforeEach(async ({ page }) => {
      // Cadastrar aluno aprovado (média >= 7)
      // Aprovado com nota 3 alta — expõe o bug da média
      // Média correta: (6+6+10)/3 = 7.33 -> Aprovado
      // Média com bug: (6+6)/2 = 6.00 -> Recuperação <- bug!
      await page.getByLabel('Nome do Aluno').fill('Aluno Aprovado');
      await page.getByLabel('Nota 1').fill('6');
      await page.getByLabel('Nota 2').fill('6');
      await page.getByLabel('Nota 3').fill('10');
      await page.getByRole('button', { name: 'Cadastrar' }).click();

      // Cadastrar aluno em Recuperação (média >= 5 e < 7) | Média correta: (5+6+5)/3 = 5.33
      await page.getByLabel('Nome do Aluno').fill('Aluno Recuperacao');
      await page.getByLabel('Nota 1').fill('5');
      await page.getByLabel('Nota 2').fill('6');
      await page.getByLabel('Nota 3').fill('5');
      await page.getByRole('button', { name: 'Cadastrar' }).click();

      // Cadastrar aluno Reprovado (média < 5) | Média correta: (2+3+1)/3 = 2
      await page.getByLabel('Nome do Aluno').fill('Aluno Reprovado');
      await page.getByLabel('Nota 1').fill('2');
      await page.getByLabel('Nota 2').fill('3');
      await page.getByLabel('Nota 3').fill('1');
      await page.getByRole('button', { name: 'Cadastrar' }).click();

      // Garantir que os três foram cadastrados
      await expect(page.locator('#tabela-alunos tbody tr')).toHaveCount(3);
    });

    test('deve exibir o total correto nos cards de estatística', async ({ page }) => {
      await expect(page.locator('#stat-total')).toHaveText('3');
    });

    test('deve exibir o total correto de aprovados', async ({ page }) => {
      // Com o bug, esse card mostra 0 em vez de 1 -> teste falha e expõe o defeito
      await expect(page.locator('#stat-aprovados')).toHaveText('1');
    });

    test('deve exibir o total correto de recuperação', async ({ page }) => {
      // Com o bug também vai falhar, pois vai mostrar 2 em vez de 1.
      await expect(page.locator('#stat-recuperacao')).toHaveText('1');
    });

    test('deve exibir o total correto de reprovados', async ({ page }) => {
      await expect(page.locator('#stat-reprovados')).toHaveText('1');
    });

    test('deve atualizar os cards corretamente ao excluir um aluno', async ({ page }) => {
      // Excluindo o aluno Reprovado
      await page.getByRole('button', { name: 'Excluir Aluno Reprovado' }).click();

      // Garantindo que a tabela atualizou
      await expect(page.locator('#tabela-alunos tbody tr')).toHaveCount(2);

      await expect(page.locator('#stat-total')).toHaveText('2');
      await expect(page.locator('#stat-reprovados')).toHaveText('0');

      await expect(page.locator('#stat-aprovados')).toHaveText('1'); //com o bug vai falhar mostrando 0
      await expect(page.locator('#stat-recuperacao')).toHaveText('1'); //com o bug vai falhar mostrando 2
    });

    test('deve zerar todos os cards ao limpar a tabela', async ({ page }) => {
      page.on('dialog', async dialog => {
        await dialog.accept();
      });
      await page.getByRole('button', { name: 'Limpar Tudo' }).click();

      await expect(page.locator('#stat-total')).toHaveText('0');
      await expect(page.locator('#stat-aprovados')).toHaveText('0');
      await expect(page.locator('#stat-recuperacao')).toHaveText('0');
      await expect(page.locator('#stat-reprovados')).toHaveText('0');
    });

  });

  // ========== GRUPO 7: 5) Teste de Situação - Aluno Aprovado ==========

  // Cadastrar aluno aprovado (média >= 7) 
  // O sistema deve mostrar o aluno como aprovado caso esteja na situação 1, 2 ou 3
  // O badge na coluna "Situação" na tabela de Resultados deve ser "Aprovado"

  //Situações:
  // 1. Exatamente igual a 7
  // 2. Exatamente igual a 10
  // 3. Entre 7 e 10 (n1 = 7, n2 = 8, n1 = 9)

  test.describe('Situação I - Aluno Aprovado (Cenários Diversos)', () => {


    test('situação: Aluno "Aprovado" com média 7', async ({ page }) => {
      await page.getByLabel('Nome do Aluno').fill('Aluno Aprovado Nota 7');
      await page.getByLabel('Nota 1').fill('7');
      await page.getByLabel('Nota 2').fill('7');
      await page.getByLabel('Nota 3').fill('7');
      await page.getByRole('button', { name: 'Cadastrar' }).click();

      const linhaAluno = page.locator('#tabela-alunos tbody tr').first();
      await expect(linhaAluno.locator('.badge')).toHaveText('Aprovado');
    });

    test('situação: Aluno "Aprovado" com média 10', async ({ page }) => {
      await page.getByLabel('Nome do Aluno').fill('Aluno Aprovado Nota 10');
      await page.getByLabel('Nota 1').fill('10');
      await page.getByLabel('Nota 2').fill('10');
      await page.getByLabel('Nota 3').fill('10');
      await page.getByRole('button', { name: 'Cadastrar' }).click();

      const linhaAluno = page.locator('#tabela-alunos tbody tr').first();
      await expect(linhaAluno.locator('.badge')).toHaveText('Aprovado');
    });

    test('Aluno "Aprovado" com notas 7, 8 e 9', async ({ page }) => {
      await page.getByLabel('Nome do Aluno').fill('Aluno Aprov Variado');
      await page.getByLabel('Nota 1').fill('7');
      await page.getByLabel('Nota 2').fill('8');
      await page.getByLabel('Nota 3').fill('9');
      await page.getByRole('button', { name: 'Cadastrar' }).click();

      const linhaAluno = page.locator('#tabela-alunos tbody tr').first();
      await expect(linhaAluno.locator('.badge')).toHaveText('Aprovado');
    });

  });

  // ========== GRUPO 8: 6) Teste de Situação - Aluno Reprovado ==========

  // Cadastrar aluno Reprovado (média < 5) 
  // O sistema deve mostrar o aluno como reprovado caso esteja nas situações abaixo
  // O badge na coluna "Situação" na tabela de Resultados deve ser "Reprovado"

  //Situações:
  // 1. Notas próximas ao limite superior de reprovação:        n1 = 5, n2 = 4, n3 = 5 = 4.66 > Status Reprovado
  // 2. Notas próximas ao limite inferior de reprovação:        n1 = 0, n2 = 0, n3 = 0 = 0.00 > Status Reprovado
  // 3. Notas entre o limite inferior e superior:               n1 = 2, n2 = 3, n3 = 4 = 3.00 > Status Reprovado
  // 4. Notas com limite inferior e superior:                   n1 = 0, n2 = 5, n3 = 3 = 2.66 > Status Reprovado
  // 5. Notas com valores decimais :                            n1 = 4.75, n2 = 4.75, n3 = 4.75 = 4.75 ou 4.80 > Status Reprovado
  // 6. Notas com valores decimais proximas ao limite superior: n1 = 4.95, n2 = 4.95, n3 = media 4.95 > Status Reprovado


  test.describe('Situação II - Aluno Reprovado (Cenários Diversos)', () => {

    // 1. Notas próximas ao limite superior de reprovação: n1 = 5, n2 = 4, n3 = 5 = 4.66 > Status Reprovado
    test('situação: Aluno "Reprovado" com notas < 5', async ({ page }) => {
      await page.getByLabel('Nome do Aluno').fill('Aluno Reprovado Nota 5');
      await page.getByLabel('Nota 1').fill('5');
      await page.getByLabel('Nota 2').fill('4');
      await page.getByLabel('Nota 3').fill('5');
      await page.getByRole('button', { name: 'Cadastrar' }).click();

      const linhaAluno = page.locator('#tabela-alunos tbody tr').first();
      await expect(linhaAluno.locator('.badge')).toHaveText('Reprovado');
    });

    // 2. Notas próximas ao limite inferior de reprovação: n1 = 0, n2 = 0, n3 = 0 = 0.00 > Status Reprovado    
    test('situação: Aluno "Reprovado" com notas = 0', async ({ page }) => {
      await page.getByLabel('Nome do Aluno').fill('Aluno Reprovado Nota 0');
      await page.getByLabel('Nota 1').fill('0');
      await page.getByLabel('Nota 2').fill('0');
      await page.getByLabel('Nota 3').fill('0');
      await page.getByRole('button', { name: 'Cadastrar' }).click();

      const linhaAluno = page.locator('#tabela-alunos tbody tr').first();
      await expect(linhaAluno.locator('.badge')).toHaveText('Reprovado');
    });

    // 3. Notas entre o limite inferior e superior: n1 = 2, n2 = 3, n3 = 4 = 3.00 > Status Reprovado
    test('situação: Aluno "Reprovado" com notas entre o limite inferior e superior', async ({ page }) => {
      await page.getByLabel('Nome do Aluno').fill('Aluno Reprovado Notas entre 0 e 5');
      await page.getByLabel('Nota 1').fill('2');
      await page.getByLabel('Nota 2').fill('3');
      await page.getByLabel('Nota 3').fill('4');
      await page.getByRole('button', { name: 'Cadastrar' }).click();

      const linhaAluno = page.locator('#tabela-alunos tbody tr').first();
      await expect(linhaAluno.locator('.badge')).toHaveText('Reprovado');
    });

    // 4. Notas com limite inferior e superior: n1 = 0, n2 = 5, n3 = 3 = 2.66 > Status Reprovado
    test('situação: Aluno "Reprovado" com notas limite inferior + limite superior + valor n', async ({ page }) => {
      await page.getByLabel('Nome do Aluno').fill('Aluno Reprovado com notas limites');
      await page.getByLabel('Nota 1').fill('0');
      await page.getByLabel('Nota 2').fill('5');
      await page.getByLabel('Nota 3').fill('3');
      await page.getByRole('button', { name: 'Cadastrar' }).click();

      const linhaAluno = page.locator('#tabela-alunos tbody tr').first();
      await expect(linhaAluno.locator('.badge')).toHaveText('Reprovado');
    });

    // 5. Notas com valores decimais : n1 = 4.75, n2 = 4.75, n3 = 4.75 = 4.75 ou 4.80 > Status Reprovado
    test('situação: Aluno "Reprovado" com notas decimais abaixo do limite superior', async ({ page }) => {
      await page.getByLabel('Nome do Aluno').fill('Aluno Reprovado Notas 4.75');
      await page.getByLabel('Nota 1').fill('4.75');
      await page.getByLabel('Nota 2').fill('4.75');
      await page.getByLabel('Nota 3').fill('4.75');
      await page.getByRole('button', { name: 'Cadastrar' }).click();

      const linhaAluno = page.locator('#tabela-alunos tbody tr').first();
      await expect(linhaAluno.locator('.badge')).toHaveText('Reprovado');
    });

    // 6. Notas com valores decimais proximas ao limite superior: n1 = 4.95, n2 = 4.95, n3 = media 4.95 > Status Reprovado
    test('situação: Aluno "Reprovado" com notas decimais abaixo mas proximas do limite superior', async ({ page }) => {
      await page.getByLabel('Nome do Aluno').fill('Aluno Reprovado Notas 4.95');
      await page.getByLabel('Nota 1').fill('4.95');
      await page.getByLabel('Nota 2').fill('4.95');
      await page.getByLabel('Nota 3').fill('4.95');
      await page.getByRole('button', { name: 'Cadastrar' }).click();

      const linhaAluno = page.locator('#tabela-alunos tbody tr').first();
      await expect(linhaAluno.locator('.badge')).toHaveText('Reprovado');
    });

  });

  // ========== GRUPO 9: 7) Teste de Multiplos Cadastros ==========
  // Teste de múltiplos cadastros: Cadastrar 3 alunos consecutivos e verificar que a tabela possui 3 linhas.

  test.describe('Múltiplos Cadastros', () => {

    test('deve exibir 3 linhas ao cadastrar 3 alunos consecutivos', async ({ page }) => {
      // Cadastrar primeiro aluno
      await page.getByLabel('Nome do Aluno').fill('Aluno Um');
      await page.getByLabel('Nota 1').fill('7');
      await page.getByLabel('Nota 2').fill('7');
      await page.getByLabel('Nota 3').fill('7');
      await page.getByRole('button', { name: 'Cadastrar' }).click();

      // Cadastrar segundo aluno
      await page.getByLabel('Nome do Aluno').fill('Aluno Dois');
      await page.getByLabel('Nota 1').fill('6');
      await page.getByLabel('Nota 2').fill('6');
      await page.getByLabel('Nota 3').fill('6');
      await page.getByRole('button', { name: 'Cadastrar' }).click();

      // Cadastrar terceiro aluno
      await page.getByLabel('Nome do Aluno').fill('Aluno Tres');
      await page.getByLabel('Nota 1').fill('3');
      await page.getByLabel('Nota 2').fill('3');
      await page.getByLabel('Nota 3').fill('3');
      await page.getByRole('button', { name: 'Cadastrar' }).click();

      // Verificar que a tabela possui exatamente 3 linhas
      await expect(page.locator('#tabela-alunos tbody tr')).toHaveCount(3);
    });

  });

  // ========== GRUPO 10: 8) Teste de Situação - Aluno em Recuperação ==========

  // Cadastrar aluno em Recuperação (média >= 5 e média < 7) 
  // O sistema deve mostrar o aluno como em recuperação caso esteja nas situações abaixo
  // O badge na coluna "Situação" na tabela de Resultados deve ser "Recuperação"

  //Situações:

  // 1. Notas próximas ao limite superior de recuperação:                     n1 = 7, n2 = 6, n3 = 6.99 > Status Recuperacao
  // 2. Notas próximas ao limite inferior de recuperação:                     n1 = 5, n2 = 5, n3 = 5 = 5.00 > Status Recuperacao
  // 3. Notas entre o limite inferior e superior:                             n1 = 5, n2 = 6, n3 = 7 > Status Recuperacao
  // 4. Notas com limite inferior e superior:                                 n1 = 5, n2 = 6.99, n3 = 7 > Status Recuperacao
  // 5. Notas com valores decimais :                                          n1 = 5.75, n2 = 6.50, n3 = 6.75 > Status Recuperacao
  // 6. Notas com valores decimais próximas ao limite superior (n = 6.75):    n1 = 6.75, n2 = 6.75, n3 = 6.75 > Status Recuperacao
  // 7. Notas com valores decimais no limite superior (6.99):                 n1 = 6.99, n2 = 6.99, n3 = 6.99 > Status Recuperacao
  // 8. Notas com valores decimais próximas ao limite inferior (n = 5.05):    n1 = 5.05, n2 = 5.05, n3 = 5.05 > Status Recuperacao
  // 9. Notas com valores decimais no limite inferior (5.01):                 n1 = 5.01, n2 = 5.01, n3 = 5.01 > Status Recuperacao

  test.describe('Situação III - Aluno em Recuperação (Cenários Diversos)', () => {

    // 1. Notas próximas ao limite superior de recuperação: n1 = 7, n2 = 6, n3 = 6.99 > Status Recuperacao
    test('situação: Aluno "Recuperação" com notas < 7', async ({ page }) => {
      await page.getByLabel('Nome do Aluno').fill('Aluno Recuperacao Limite Superior');
      await page.getByLabel('Nota 1').fill('7');
      await page.getByLabel('Nota 2').fill('6');
      await page.getByLabel('Nota 3').fill('6.99');
      await page.getByRole('button', { name: 'Cadastrar' }).click();

      const linhaAluno = page.locator('#tabela-alunos tbody tr').first();
      await expect(linhaAluno.locator('.badge')).toHaveText('Recuperação');
    });

    // 2. Notas próximas ao limite inferior de recuperação: n1 = 5, n2 = 5, n3 = 5 = 5.00 > Status Recuperacao 
    test('situação: Aluno "Recuperação" com notas = 5', async ({ page }) => {
      await page.getByLabel('Nome do Aluno').fill('Aluno Recuperacao Limite Inferior');
      await page.getByLabel('Nota 1').fill('5');
      await page.getByLabel('Nota 2').fill('5');
      await page.getByLabel('Nota 3').fill('5');
      await page.getByRole('button', { name: 'Cadastrar' }).click();

      const linhaAluno = page.locator('#tabela-alunos tbody tr').first();
      await expect(linhaAluno.locator('.badge')).toHaveText('Recuperação');
    });

    // 3. Notas entre o limite inferior e superior: n1 = 5, n2 = 6, n3 = 7 > Status Recuperacao
    test('situação: Aluno "Recuperação" com notas entre o limite inferior e superior', async ({ page }) => {
      await page.getByLabel('Nome do Aluno').fill('Aluno Recuperacao entre o limite inferior e superior');
      await page.getByLabel('Nota 1').fill('5');
      await page.getByLabel('Nota 2').fill('6');
      await page.getByLabel('Nota 3').fill('7');
      await page.getByRole('button', { name: 'Cadastrar' }).click();

      const linhaAluno = page.locator('#tabela-alunos tbody tr').first();
      await expect(linhaAluno.locator('.badge')).toHaveText('Recuperação');
    });

    // 4. Notas com limite inferior e superior: n1 = 5, n2 = 6.99, n3 = 7 > Status Recuperacao
    test('situação: Aluno "Recuperação" com notas nos limites superior e inferior', async ({ page }) => {
      await page.getByLabel('Nome do Aluno').fill('Aluno Recuperacao nos limites superior e inferior');
      await page.getByLabel('Nota 1').fill('5');
      await page.getByLabel('Nota 2').fill('6.99');
      await page.getByLabel('Nota 3').fill('7');
      await page.getByRole('button', { name: 'Cadastrar' }).click();

      const linhaAluno = page.locator('#tabela-alunos tbody tr').first();
      await expect(linhaAluno.locator('.badge')).toHaveText('Recuperação');
    });

    // 5. Notas com valores decimais : n1 = 5.75, n2 = 6.50, n3 = 6.75 > Status Recuperacao
    test('situação: Aluno "Recuperação" com notas decimais entre os limites', async ({ page }) => {
      await page.getByLabel('Nome do Aluno').fill('Aluno Recuperacao com notas decimais');
      await page.getByLabel('Nota 1').fill('5.75');
      await page.getByLabel('Nota 2').fill('6.50');
      await page.getByLabel('Nota 3').fill('6.75');
      await page.getByRole('button', { name: 'Cadastrar' }).click();

      const linhaAluno = page.locator('#tabela-alunos tbody tr').first();
      await expect(linhaAluno.locator('.badge')).toHaveText('Recuperação');
    });

    // 6. Notas com valores decimais próximas ao limite superior (n = 6.75) > Status Recuperacao
    test('situação: Aluno "Recuperação" com notas decimais abaixo mas proximas do limite superior', async ({ page }) => {
      await page.getByLabel('Nome do Aluno').fill('Aluno Recuperacao notas 6.75');
      await page.getByLabel('Nota 1').fill('6.75');
      await page.getByLabel('Nota 2').fill('6.75');
      await page.getByLabel('Nota 3').fill('6.75');
      await page.getByRole('button', { name: 'Cadastrar' }).click();

      const linhaAluno = page.locator('#tabela-alunos tbody tr').first();
      await expect(linhaAluno.locator('.badge')).toHaveText('Recuperação');
    });

    // 7. Notas com valores decimais no limite superior (6.99) > Status Recuperacao
    test('situação: Aluno "Recuperação" com notas decimais no limite superior', async ({ page }) => {
      await page.getByLabel('Nome do Aluno').fill('Aluno Recuperacao notas 6.99');
      await page.getByLabel('Nota 1').fill('6.99');
      await page.getByLabel('Nota 2').fill('6.99');
      await page.getByLabel('Nota 3').fill('6.99');
      await page.getByRole('button', { name: 'Cadastrar' }).click();

      const linhaAluno = page.locator('#tabela-alunos tbody tr').first();
      await expect(linhaAluno.locator('.badge')).toHaveText('Recuperação');
    });

    // 8. Notas com valores decimais próximas do limite inferior (5.05) > Status Recuperacao
    test('situação: Aluno "Recuperação" com notas decimais próximas do limite inferior', async ({ page }) => {
      await page.getByLabel('Nome do Aluno').fill('Aluno Recuperacao notas 5.05');
      await page.getByLabel('Nota 1').fill('5.05');
      await page.getByLabel('Nota 2').fill('5.05');
      await page.getByLabel('Nota 3').fill('5.05');
      await page.getByRole('button', { name: 'Cadastrar' }).click();

      const linhaAluno = page.locator('#tabela-alunos tbody tr').first();
      await expect(linhaAluno.locator('.badge')).toHaveText('Recuperação');
    });

    // 9. Notas com valores decimais no limite inferior (5.01) > Status Recuperacao
    test('situação: Aluno "Recuperação" com notas decimais no limite inferior', async ({ page }) => {
      await page.getByLabel('Nome do Aluno').fill('Aluno Recuperacao notas 5.01');
      await page.getByLabel('Nota 1').fill('5.01');
      await page.getByLabel('Nota 2').fill('5.01');
      await page.getByLabel('Nota 3').fill('5.01');
      await page.getByRole('button', { name: 'Cadastrar' }).click();

      const linhaAluno = page.locator('#tabela-alunos tbody tr').first();
      await expect(linhaAluno.locator('.badge')).toHaveText('Recuperação');
    });

  });

});
# 🧠 CÉREBRO DO PROJETO: GUIA OPERACIONAL & ESPECIFICAÇÃO DE FECHAMENTO ACQUAPLAY

> **Documento Oficial de Engenharia & Regra de Negócio**  
> **Fonte Primária:** [Notion de Henrique Bezerra dos Santos](https://app.notion.com/p/Planilha-Excel-Acquaplay-3a337ba866498077a79cc90cab0ae828)  
> **Responsável:** Henrique Bezerra dos Santos (Hydrojexe Individualizações)  
> **Data de Sincronização:** 19/10/2026  
> **Objetivo:** Registrar com 100% de fidelidade a rotina manual de fechamento e as especificações de automação para retomada em casa.

---

## 🏢 1. Contexto do Empreendimento
- **Condomínio:** AcquaPlay Home & Resort (Santos/SP — Ponta da Praia)
- **Escala:** 1.435 Unidades Residenciais distribuídas em 8 Torres (Torres A até H)
- **Concessionárias:**
  - **Sabesp:** Água e Esgoto (medição individualizada por hidrômetros)
  - **Comgás:** Gás Natural Canalizado (16 medidores mestres nas torres, 2 por torre, rateados para os apartamentos)
- **Parceiro Operacional / Administradora:** Sérgio (Planilha "Conta Justa")

---

## 📁 2. Estrutura de Pastas e Caminhos Oficiais
```text
Acquaplay/
├── 2026/
│   ├── fotos medidores/
│   │   └── [mês de referência]/              <- Fotos dos medidores Comgás (1º andar)
│   ├── água/
│   │   ├── fotos hidrômetros/
│   │   │   └── [mês de referência]/          <- Fotos dos hidrômetros dos apartamentos
│   │   ├── conta justa/
│   │   │   └── [mês de referência]/          <- Planilhas enviadas pelo Sérgio
│   │   └── aqui estão os extratos/           <- Nossos extratos mensais oficiais de água
│   └── gás/
│       ├── contas Comgás/
│       │   └── [mês de referência]/          <- Faturas PDF/dados baixados do site Comgás
│       └── [mês de referência]/              <- Nossos extratos mensais de gás
└── Acquaplay execução/
    ├── tabela Sabesp/                        <- Planilha automática Sabesp 2026
    ├── médias/                               <- Planilha de acompanhamento de médias
    └── comparativo/
        └── comparativo água x gás            <- Planilha de auditoria cruzada 3:1
```

---

## ⚡ 3. Rotina Operacional Detalhada (Passo a Passo)

### 3.1. Módulo Comgás (Faturas e Tarifa Mestre)
1. **Coleta de Fotos:** Fotografar os 16 medidores do 1º andar e salvar em `Acquaplay > 2026 > fotos medidores > [mês]`.
2. **Download das Faturas:**
   - Acessar `virtual.comgas.com.br/?/login=cliente`.
   - Inserir o **CNPJ do Acquaplay** e os **códigos de usuário** (destacados em amarelo nas contas anteriores).
   - Baixar e salvar as contas uma a uma na pasta da Comgás do mês.
3. **Regra de Manutenção Comgás (CRÍTICA):**
   > *“Manutenções dos medidores da Comgás: Para o Sérgio não precisam colocar no valor total e nem da manutenção...”*
   - As contas Comgás podem vir com taxas de manutenção pontuais da concessionária.
   - **Regra:** Essas taxas devem ser subtraídas do total antes de calcular a tarifa e enviar para o Sérgio.
4. **Cálculo da Tarifa de Rateio:**
   $$\text{Tarifa Rateio (R\$/m³)} = \frac{\text{Total das Contas Comgás (sem manutenção)}}{\text{Volume Total em m³ faturado}}$$
5. **Envio Inicial:** Enviar para o Sérgio sem as fotos de leitura atual, somente os valores faturados por bloco.
6. **Consumo por Torre:** Na planilha da Comgás, na aba Hydrojexe ("Consumo por torre"), os valores são extraídos da planilha do Sérgio na parte de "Detalhes da Torre".

---

### 3.2. Módulo Água (Sabesp & Conciliação)
1. **Importação dos Índices:** Alimentar a planilha interna com os índices atuais coletados nas fotos.
2. **Filtro de Higienização Obrigatório:**
   - Filtrar: **Altos Consumos**, **Baixos Consumos** e **Negativos**.
   - *"Verificar um por um para não passar nenhum erro, NÃO PODE ERRAR."*
3. **Disparo para o Sérgio:** Enviar nossa planilha com os índices para o Sérgio e aguardar a devolução da folha dele ("Conta Justa").
4. **Preparação do Extrato:**
   - Copiar o extrato do mês anterior e renomear para o mês de referência.
   - Atualizar os metadados de cabeçalho:
     - **Mês de Referência** (ex: Outubro/2026)
     - **Data da Leitura Atual**
     - **Data da Leitura Anterior**
     - **Data da Próxima Leitura**
   - Transpor a leitura atual para a anterior, e preencher a leitura atual com a nova medição (ou via `PROCX`/`XLOOKUP`).
5. **Desmembramento da Planilha do Sérgio:**
   - Criar uma aba desmembrada na planilha dele com: `Nome Medidor`, `Leitura Anterior`, `Leitura Atual`, `Consumo` e `Valor`.
6. **Conciliação Sabesp (Verdadeiro ou Falso):**
   - Cruzar os valores na planilha automática Sabesp 2026 contra os valores do Sérgio.
   - **Tolerância contábil:** $\pm \text{R\$\ } 0,02$.
   - **VERDADEIRO:** Aprovado para o extrato.
   - **FALSO:** Documentar no relatório Word para o Sérgio, detalhando o motivo da diferença.
7. **Regra de Retroativo Sabesp:**
   - Se no mês anterior foi lançada uma leitura errada e no mês atual o consumo disparou, deve ser apurado um retroativo (especialmente se ultrapassou a cota mínima de $10\text{ m}^3$).

---

### 3.3. Módulo Gás (Medições Individuais & Troca de Cybles)
1. **Configuração do Extrato de Gás:**
   - Duplicar extrato anterior e ajustar: Referência, Datas (anterior, atual, próxima), Valor Total da Comgás e Volume Total $m^3$.
   - Copiar leitura atual do Sérgio e área comum recebida por e-mail.
2. **Tratamento de Consumo Negativo (Troca de Gasômetro / Cyble):**
   - Consumo negativo indica troca física do gasômetro ou cyble.
   - **Regra:** Se no mês anterior não foi cobrado o retroativo do medidor retirado, lançar o retroativo agora e reiniciar a leitura do novo medidor a partir do zero.
   - Inserir observação formal no extrato: *"Cyble trocado em [data]; Leitura final do antigo: [X] m³"*.
3. **Análise de Médias:**
   - **Média padrão de referência para gás:** $20\text{ m}^3$.
   - Filtrar quem está acima da média. Se meses anteriores estavam zerados, registrar como consumo retroativo acumulado.
4. **Regra de Ouro da Operação:**
   > *“Só mexer nos índices negativos, o resto deixa para lá.”*

---

### 3.4. Auditoria Cruzada Água x Gás (Regra 3:1)
1. Alimentar a planilha comparativa com os volumes consumidos de água e gás de cada um dos 1.435 apartamentos.
2. **Critérios de Disparidade (Vistoria In Loco):**
   - $\text{Gás} \ge 3 \times \text{Água}$ (com água ativa) ou $\text{Gás} > 0$ com $\text{Água} = 0 \rightarrow$ Suspeita de hidrômetro travado.
   - $\text{Água} \ge 3 \times \text{Gás}$ (com gás ativo) ou $\text{Água} > 0$ com $\text{Gás} = 0 \rightarrow$ Suspeita de medidor de gás parado.
3. **Encaminhamento:**
   - Gerar relatório das unidades que precisam de vistoria para anexar ao e-mail/WhatsApp do condomínio e do Sérgio.

---

## 🛠️ 4. Roadmap de Implementação no AcquaPlay Hub (Para fazer em Casa)

### FASE 1: Motor & Regras de Negócio (`lib/acquaPlayEngine.ts`)
- [ ] Adicionar cálculo com expurgo de manutenção Comgás: `calcularTarifaComgasLiquida(contas, valorManutencao)`.
- [ ] Adicionar detector de anomalias:
  - `detectarConsumosNegativos(leituras)`
  - `detectarAltosBaixosConsumos(consumos, mediaRefGas = 20)`
- [ ] Gerador de texto do relatório do Sérgio:
  - Função que gera o texto pré-formatado das divergências para envio no WhatsApp/Word.

### FASE 2: Interface & Console (`components/dashboard/`)
- [ ] **Barra de Metadados do Ciclo:** Inputs para `Mês Referência`, `Data Anterior`, `Data Atual`, `Próxima Leitura`.
- [ ] **Filtros Rápidos na Tabela:** Botões para filtrar *Negativos*, *Altos Consumos (> média)*, *Quase Zerados (0,1 m³)* e *Divergências*.
- [ ] **Card Comgás com Campo de Manutenção:** Input opcional para deduzir despesas de manutenção da fatura mestre.
- [ ] **Aba / Botão "Gerar Relatório do Sérgio":** Modal que exibe o resumo pronto com botão "Copiar para Área de Transferência".

### FASE 3: Extrato Excel Oficial (`XLSX`)
- [ ] Incluir cabeçalho com as datas no `.xlsx` gerado.
- [ ] Adicionar coluna de `Observações (Cybles trocados / Retroativos)`.
- [ ] Exportar a aba específica `Comparativo_3x1_Vistorias`.

---

## 🔒 5. Estado do Versionamento (Git Sync)
- **Repositório:** `https://github.com/Henrique1601/Acquaplay-hub.git`
- **Branch Principal:** `main`
- **Sincronização:** Todas as especificações foram salvas na pasta `docs/` e commitadas no repositório para que um simples `git pull` no seu PC de casa traga tudo atualizado.

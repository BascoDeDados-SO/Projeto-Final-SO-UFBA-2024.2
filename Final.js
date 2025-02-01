// definicao de variaveis importantes
let chart;
let tempoAtual = 0;
const processos = [];
const categoriasX = [];
let prio = [];
const RAM_SIZE = 50;
const DISCO_SIZE = 120;
let fifoMemoriaAtivo = true; //variavel que controla o gerenciamento da memoria
let lruMemoriaAtivo = false; //variavel que controla o gerenciamento da memoria
let pids = 1; //variavel auxiliar para criacao dos processos
let disco = Array(120).fill(-1);
let ram = Array(50).fill(-1);
let tirarDaRam = 0; //variavel auxiliar para Fifo_Memoria;


// Referências aos elementos HTML
const quantumInput = document.querySelector("#quantum");
const sobrecargaInput = document.querySelector("#sobrecarga");
const tempoChegadaInput = document.querySelector("#tempoChegada");
const tempoExecucaoInput = document.querySelector("#tempoExecucao");
const deadlineInput = document.querySelector("#deadline");
const paginasInput = document.querySelector("#paginas");
const adicionarBtn = document.querySelector("#adicionar");
const listaProcessos = document.querySelector("#listaProcessos");
const gerarGraficoBtn = document.querySelector("#gerarGrafico");
let valorslider = 500; // Valor inicial do intervalo
let intervalId;

// ------------------------FUNCOES DE CCONTROLE DO CODDIGO------------------------------
function toggleButtons(disabled, activeAlgorithmId = null) { // funcao que desabilita os botoes enquanto uma operacao esta rolando
    const buttons = document.querySelectorAll("#botaoFIFO, #botaoSJF, #botaoEDF, #botaoRoundRobin, #Fifo_Memoria, #Lru_Memoria");
    buttons.forEach(button => {
        button.disabled = disabled;
        
        // Remove a classe de destaque de todos
        if (!disabled) button.classList.remove('active-algorithm');
    });

    // Adiciona destaque no algoritmo ativo
    if (activeAlgorithmId) {
        const activeBtn = document.getElementById(activeAlgorithmId);
        if (activeBtn) activeBtn.classList.add('active-algorithm');
    }
}

const slider = document.getElementById("slider");
const sliderValue = document.getElementById("slider-value");

slider.addEventListener("input", function () { // Slider para aumentar ou diminuir velocidade do grafico
    
    valorslider = parseInt(slider.value);
    sliderValue.textContent = valorslider;
    if (intervalId) clearInterval(intervalId);
    iniciarAtualizacao();
});

function iniciarAtualizacao() {
    intervalId = setInterval(() => {
        console.log("Atualizando a cada", valorslider, "ms");
    }, valorslider);
}

function delay(ms) {
    
    return new Promise(resolve => {
        setTimeout(() => {
            requestAnimationFrame(resolve); // 👈 Permite atualização da UI
        }, ms);
    });
    
}

function resetSimulacao() { // funcao para resetar as variaveis importantes quando refazer alguma simulacao
    // Destruir o gráfico existente
    if (chart) {
        chart.destroy();
    }

    // Resetar variáveis de estado
    tempoAtual = 0;
    prio = [];
    tirarDaRam = 0;
    ram.fill(-1); // Limpar RAM
    disco.fill(-1); // Limpar Disco
    // Ocultar resultados anteriores
    const turnaroundContainer = document.querySelector("#turnaroundContainer");
    turnaroundContainer.style.display = "none";
    inicializarGrafico();
    
}


//---------------------------FUNCOES DO VISUAL DO SITE------------------------------
function criarMemoria(idTabela, tamanho) { // Funcao para criar as memoriaas tabela 5 * 10 para Ram e 12 * 10 para disco
    const tabela = document.getElementById(idTabela);
    let linha;
    if (idTabela === "ram"){ 
        for (let i = 0; i < tamanho; i++) {
        if (i % 10 === 0) {  // Quebra de linha a cada 10 células
            linha = document.createElement("tr");
            tabela.appendChild(linha);
        }
        
        const celula = document.createElement("td");
        celula.classList.add("vazio"); // Começa como vazio
        celula.textContent = "-"; // Indica que está vazia
        linha.appendChild(celula);
    }
    }
    else if (idTabela === "disco"){
        for (let i = 0; i < tamanho; i++) {
            if (i % 12 === 0) {  // Quebra de linha a cada 10 células
                linha = document.createElement("tr");
                tabela.appendChild(linha);
            }
            
            const celula = document.createElement("td");
            celula.classList.add("vazio"); // Começa como vazio
            celula.textContent = "-"; // Indica que está vazia
            linha.appendChild(celula);
        }
    }
    
}

function atualizarBotoesMemoria() { // Atualiza visualmente os botoes do gerenciamente de memoria
    const btnFifo = document.getElementById("Fifo_Memoria");
    const btnLru = document.getElementById("Lru_Memoria");
    
    btnFifo.classList.toggle("ativo", fifoMemoriaAtivo);
    btnLru.classList.toggle("ativo", lruMemoriaAtivo);
}

function atualizarRam() { // Atualiza visualmente a ram
    let tabelaDisco = document.getElementById("ram");
    tabelaDisco.innerHTML = ""; // Limpa a tabela anterior

    let rows = 5; // Linhas da tabela
    let cols = 10; // Colunas da tabela
    let index = 0;

    for (let i = 0; i < rows; i++) {
        let row = tabelaDisco.insertRow();
        for (let j = 0; j < cols; j++) {
            let cell = row.insertCell();
            cell.textContent = ram[index] === -1 ? "-" : ram[index]; // Mostra o número do processo ou "-"
            cell.style.border = "1px solid black"; // Borda para visualizar melhor
            cell.style.width = "30px";
            cell.style.height = "30px";
            cell.style.textAlign = "center";
            index++;
        }
    }
}

function atualizarDisco() { // atualiza visualmente o disco
    let tabelaDisco = document.getElementById("disco");
    tabelaDisco.innerHTML = ""; // Limpa a tabela anterior

    let rows = 10; // Linhas da tabela
    let cols = 12; // Colunas da tabela
    let index = 0;

    for (let i = 0; i < rows; i++) {
        let row = tabelaDisco.insertRow();
        for (let j = 0; j < cols; j++) {
            let cell = row.insertCell();
            cell.textContent = disco[index] === -1 ? "-" : disco[index]; // Mostra o número do processo ou "-"
            cell.style.border = "1px solid black"; // Borda para visualizar melhor
            cell.style.width = "30px";
            cell.style.height = "30px";
            cell.style.textAlign = "center";
            index++;
        }
    }
}

function atualizarLista() { // atualiza visualmente a lista de processos
    listaProcessos.innerHTML = "";
    processos.forEach((processo, index) => {
        const li = document.createElement("li");
        li.id = `processo-${index}`; // Define um ID para identificar o processo
        li.classList.add("processo"); // Classe padrão para os itens da lista
        li.textContent = `Processo ${index + 1}: Tempo Chegada = ${processo.tempoChegada}, Tempo Execução = ${processo.tempoExecucao}, Deadline = ${processo.deadline}, Páginas = ${processo.paginas},`;

        // Botão de Editar
        const editarBtn = document.createElement("button");
        editarBtn.textContent = "Editar";
        editarBtn.classList.add("btn-editar");
        editarBtn.addEventListener("click", () => editarProcesso(index));
        li.appendChild(editarBtn);

        // Botão de Remover
        const removerBtn = document.createElement("button");
        removerBtn.textContent = "Remover";
        removerBtn.classList.add("btn-remover");
        removerBtn.addEventListener("click", () => removerProcesso(index));
        li.appendChild(removerBtn);

        listaProcessos.appendChild(li);
    });
}

function inicializarGrafico() { // inicializa o grafico com 300 de tempo
    if (chart) {
        chart.destroy();
    }

    // Cria array fixo de 300 categorias (0-199)
    categoriasX.length = 0;
    for (let i = 0; i < 300; i++) {
        categoriasX.push(i.toString());
    }

    const series = processos.map((_, index) => ({
        name: `Processo ${index + 1}`,
        data: categoriasX.map((_, i) => ({ 
            x: i,
            y: -2
        }))
    }));
    let newHeight;  
    newHeight = 100 + (processos.length * 20);
    chart = new ApexCharts(document.querySelector("#chart"), {
        series: series,
        chart: {
            height: newHeight, // Altura fixa de 100px por processo
            type: "heatmap",
            animations: { enabled: false },
            toolbar: { show: false },
            zoom: { enabled: false } // Desativa zoom para melhor controle
        },
        legend: {
            position: 'top', // Posiciona no topo
            showForSingleSeries: true,      
            horizontalAlign: 'left', // Alinha à esquerda dentro do espaço do topo
        },
        plotOptions: {
            heatmap: {
                cellWidth: 40, // Largura aumentada das células
                cellHeight: 100, 
                // Altura fixa de 100px
                colorScale: {
                    ranges: [
                        { from: 0, to: 0, color: "#F2FF00", name: "Espera" },
                        { from: 1, to: 1, color: "#00E396", name: "Execução" },
                        { from: -2, to: -1, color: "#FFFFFF", name: "Inativo" },
                        { from: 2, to: 2, color: "#FF0000", name: "Sobrecarga" },
                        { from: 3, to: 3, color: "#383838", name: "estouro deadline" },	
                    ],
                },
                
            },
        },
        dataLabels: { enabled: false },
        xaxis: { 
            categories: categoriasX,
            title: { text: "Tempo" },
            labels: {
                show: true,
                rotate: -45, // Rotaciona labels para melhor visualização
                style: { fontSize: '10px' } // Reduz tamanho da fonte
            },
            tickAmount: 300 // Força exibição de todos os ticks
        },
        yaxis: { 
            title: { text: "Processos" },
            labels: { show: true }
        }
    });

    chart.render();
}
 

// ---------------------------Funcoes de simulacao Memoria e auxiliares------------------------------
function retirarTudoRam(processoSaindo) { // retira todas as paginas de um processo da ram
    for ( var i = 0; i < ram.length; i++) {
        if (ram[i] === processoSaindo.pids) {
            ram[i] = -1;
        }
}
}

function retirarDoDisco(processo) { // retira todas as paginas de um processo do disco
    // Encontra e remove uma página específica do disco
    for (let i = 0; i < disco.length; i++) {
        if (disco[i] === processo.pids) {
            disco[i] = -1;
        }
    }
}

function alocarProcessoNoDisco(processo) { // coloca as paginas de um processo no disco
    let paginas = processo.paginas; // Número de páginas do processo
    let idProcesso = processo.pids; // ID do processo (começa em 1)
    let paginasAlocadas = 0; // Contador de páginas alocadas

    for (let i = 0; i < disco.length; i++) {
        if (paginasAlocadas === paginas) break; 
        if (disco[i] === -1) {
            disco[i] = idProcesso; // Aloca o ID do processo no Disco
            paginasAlocadas++;

            // Para ao alocar todas as páginas
        }
    }

    atualizarDisco(); // Atualiza a tabela visível no HTML
}

function Fifo_Memoria(proc, processo) {
    // Verifica se o processo já está na RAM
    if (ram.includes(processo.pids)) {
        return false;
    }
    let fault = false;
    const paginasRestantes = processo.paginas;
    
    for (let i = 0; i < paginasRestantes; i++) {
        // Atualiza o ponteiro de forma circular
        tirarDaRam = tirarDaRam % ram.length;
        
        // Substituição de página necessária
        if (ram[tirarDaRam] !== -1) {
            let processoRemovido;
            for (let j = 0; j < processos.length; j++){
                if (processos[j].pids === ram[tirarDaRam]) {
                    processoRemovido = processos[j];
                }
            }
            alert("Page Fault: páginas do processo " + processoRemovido.pids + " removidas " );
            alocarProcessoNoDisco(processoRemovido);
            
            retirarTudoRam(processoRemovido);
            fault = true;
            
        }

        // Aloca a nova página
        ram[tirarDaRam] = processo.pids;
        
        
        // Atualiza ponteiro FIFO
        tirarDaRam++;
    }
    retirarDoDisco(processo);
    atualizarDisco();
    atualizarRam(); // Atualiza a tabela visível no HTML

    return;
}

function Lru_Memoria(processo){
    for (let i = 0; i < prio.length;i++) {
       if (prio[i].pids === processo.pids ){  
            prio.splice(i, 1);
            prio.push(processo);
            return;
        }
    } 
    let espacoLivre = 0;
    // Libera espaço removendo processos antigos
    while (espacoLivre < processo.paginas) {
        
        for (let j = 0; j < ram.length; j++){
            if (ram[j] === -1) {
                ram[j] = processo.pids;
                espacoLivre++;
            }
            
            if (espacoLivre === processo.paginas) {
                prio.push(processo);
                retirarDoDisco(processo);
                atualizarRam();
                atualizarDisco();
                return;
            }
            
        }
        let processoRemover = prio.shift();
        alert("Page Fault: páginas do processo " + processoRemover.pids + " removidas" );
        alocarProcessoNoDisco(processoRemover);
        retirarTudoRam(processoRemover);
    }
    
    // Atualiza visualizações
    

}

//-----------------------------------------






// -----------------------Funcoes para adicionar Processos --------------------
adicionarBtn.addEventListener("click", () => { // botao adicionar processos
    const tempoChegada = Number(tempoChegadaInput.value);
    const tempoExecucao = Number(tempoExecucaoInput.value);
    const deadline = Number(deadlineInput.value);
    const paginas = Number(paginasInput.value);

    if (isNaN(tempoChegada) || isNaN(tempoExecucao) || isNaN(deadline)) {
        alert("Por favor, insira apenas números.");
        return;
    }
    if(tempoExecucao <= 0 || tempoChegada < 0 || deadline < 0 ||paginas < 0) { 
        alert("por favor insira numeros validos");
        return;
    }


    if (indiceEdicao !== null) {
        // Se estiver editando um processo existente
        processos[indiceEdicao] = {
            ...processos[indiceEdicao], // Mantém o PID e estado
            tempoChegada,
            tempoExecucao,
            deadline,
            paginas
        };
        indiceEdicao = null;
        adicionarBtn.textContent = "Adicionar"; // Volta ao estado normal
    } else {
        // Se for um novo processo
        const processo = { tempoChegada, tempoExecucao, deadline, paginas, estado: -1, pids };
        pids++;
        processos.push(processo);
    }
    atualizarLista();
    tempoChegadaInput.value = "";
    tempoExecucaoInput.value = "";
    deadlineInput.value = "";
    paginasInput.value = "";
    
});

let indiceEdicao = null;
function editarProcesso(index) { // editar processo
    if (indiceEdicao === index) {
        cancelarEdicao();
        return;
    }
    const processo = processos[index];
    
    // Preenche os campos de entrada com os valores atuais do processo
    tempoChegadaInput.value = processo.tempoChegada;
    tempoExecucaoInput.value = processo.tempoExecucao;
    deadlineInput.value = processo.deadline;
    paginasInput.value = processo.paginas;
     
    // Armazena o índice do processo em edição
    indiceEdicao = index;

    // Muda o botão "Adicionar" para "Salvar"
    adicionarBtn.textContent = "Salvar";

    

    document.querySelectorAll(".processo").forEach(proc => {
        proc.classList.remove("processo-em-edicao");
    });

    // Adiciona a classe de destaque ao processo em edição
    const processoElemento = document.getElementById(`processo-${index}`);
    if (processoElemento) {
        processoElemento.classList.add("processo-em-edicao");
    }

}

function cancelarEdicao() { 
    // Limpa os campos de entrada
    tempoChegadaInput.value = "";
    tempoExecucaoInput.value = "";
    deadlineInput.value = "";
    paginasInput.value = "";

    // Reseta o índice de edição
    indiceEdicao = null;

    // Volta o botão "Salvar" para "Adicionar"
    adicionarBtn.textContent = "Adicionar";


    // Remove o destaque do processo que estava sendo editado
    document.querySelectorAll(".processo").forEach(li => {
        li.classList.remove("processo-em-edicao");
    });
}

function removerProcesso(index) { // funcao para remover o processo da lista
    // Remove o processo da lista
    processos.splice(index, 1);

    // Atualiza a lista de processos
    atualizarLista();
}
document.getElementById("reset-btn").addEventListener("click", () => {
    location.reload(); // Recarrega a página
});


//---------------------------FUNCOES DE GERENCIAMENTO DE PROCESSOS E AUXILIARES ---------------------------


function atualizarProntos(proc, tempoAtual) { // atualiza os estados que estao esperando para serem executados
    for (let i = 0; i < proc.length; i++) {
        if (tempoAtual >= proc[i].tempoChegada && proc[i].estado === -1) {
            proc[i].estado = 0; // Define o processo como em espera
        }
    }
}

function avancarTempo(proc) { // avanca o tempo na simulacao e pinta o grafico.
    const indice = tempoAtual; 
    document.getElementById('chartContainer').style.overflowX = 'scroll';

    const novaSerie = proc.map((processo, index) => {
        const newData = [...chart.w.config.series[index].data];
        newData[indice] = { 
            x: indice, 
            y: processo.estado,
            // 👇 Propriedade personalizada para borda
            stroke: {
                colors: ['#000000'], // Cor da borda cinza
                width: 1
            }
        };
        return {
            name: `Processo ${index + 1}`,
            data: newData
        };
    });

    chart.updateSeries(novaSerie);
    tempoAtual++;
}

// FIFO com a lógica original e atualização dinâmica do gráfico
async function fifo(proc) {
    
    tempoAtual = 0; // Reseta o tempo atual
    let procCopia = [...proc];
    let turnAround = 0;
    let tempoDeFila = 0;
    const n = proc.length;
    proc.sort((a, b) => a.tempoChegada - b.tempoChegada);
    atualizarProntos(proc, tempoAtual);

    while (proc.length > 0) {
        const processoAtual = proc[0];
        
        if (processoAtual.tempoChegada <= tempoAtual) {
            if (fifoMemoriaAtivo){
                Fifo_Memoria(proc, processoAtual);
            }
            else{
                Lru_Memoria(processoAtual);
            }
            while (processoAtual.tempoExecucao > 0) {

                processoAtual.estado = 1; // Processo em execução
                avancarTempo(procCopia);
                atualizarProntos(proc, tempoAtual);
                processoAtual.tempoExecucao--;
                await delay(valorslider);
            }

            // Calcular tempo de fila e turno
            processoAtual.estado = -1;
            tempoDeFila = tempoAtual - processoAtual.tempoChegada;
            turnAround += tempoDeFila;
            proc.shift(); // Remove o processo executado
        } else {
            avancarTempo(procCopia);
            atualizarProntos(proc, tempoAtual);
            await delay(valorslider);// Avança o tempo até o próximo processo
        }
        
    }

    const turnaroundContainer = document.querySelector("#turnaroundContainer");
    const turnaroundValor = document.querySelector("#turnaroundValor");
    turnaroundValor.textContent = `${(turnAround/n).toFixed(2)}`;
    turnaroundContainer.style.display = "block";
   
    toggleButtons(false);
    return;

}
async function SJF(proc){
    
    tempoAtual = 0; // Reseta o tempo
    let prontos = [];
    let procCopia = [...proc]; // Cópia dos processos originais
    let turnAround = 0;
    let tempoDeFila = 0;
    const n = proc.length;

    // Ordena os processos por tempo de chegada
    proc.sort((a, b) => a.tempoChegada - b.tempoChegada);

    while (prontos.length > 0 || proc.length > 0) {
        // Atualiza a lista de prontos com os processos que chegaram
        atualizarProntos(proc, tempoAtual);
        let i =0;
        while (i < proc.length) {
            if (proc[i].estado == 0) {
                prontos.push(proc[i]);
                proc.splice(i, 1); // Remove o processo da fila original
            } else {
                i++;
            }
        
        }
        // Ordena a fila de prontos pelo tempo de execução (menor primeiro)
        prontos.sort((a, b) => a.tempoExecucao - b.tempoExecucao);

        if (prontos.length > 0) {
            let processoAtual = prontos.shift(); // Pega o processo com menor tempo de execução
            if (fifoMemoriaAtivo){
                Fifo_Memoria(proc, processoAtual);
            }
            else{
                Lru_Memoria(processoAtual);
            }
            // Executa o processo tick por tick
            while (processoAtual.tempoExecucao > 0) {
                processoAtual.estado = 1; // Processo em execução
                avancarTempo(procCopia);
                atualizarProntos(proc, tempoAtual);
                processoAtual.tempoExecucao--;
                await delay(valorslider);
            }

            // Finaliza o processo
            processoAtual.estado = -1;
            tempoDeFila = tempoAtual - processoAtual.tempoChegada;
            turnAround += tempoDeFila;

        } else {
            // Avança o tempo se não houver processos prontos
            avancarTempo(procCopia);
            await delay(valorslider);
        }
    }

    // Exibir o Turnaround Médio
    const turnaroundContainer = document.querySelector("#turnaroundContainer");
    const turnaroundValor = document.querySelector("#turnaroundValor");
    turnaroundValor.textContent = `${(turnAround / n).toFixed(2)}`;
    turnaroundContainer.style.display = "block";
    
    toggleButtons(false);
}
async function edf(proc, quantum, sobrecarga) {
    
    let procCopia = [...proc];
    tempoAtual = 0;// Reseta o tempo atual
    let prontos = [], chegando = [];
    let turnAround = 0;
    //let tempoDeFila = 0;
    let q = quantum;
    const n = proc.length;
    proc.sort((a, b) => a.tempoChegada - b.tempoChegada);
    atualizarProntos(proc, tempoAtual);




    for (var i = 0; i < proc.length; i++){
        chegando.push(proc[i])
    }

    while (chegando.length > 0 || prontos.length > 0) {
        while (prontos.length === 0 && chegando.length > 0 && chegando[0].tempoChegada > tempoAtual){
            avancarTempo(procCopia);
            await delay(valorslider);
        }
        
        if (prontos.length === 0 && chegando.length > 0 && tempoAtual === chegando[0].tempoChegada){
            while (chegando.length > 0 && tempoAtual === chegando[0].tempoChegada){
                prontos.push(chegando.shift());
            }
            prontos.sort((a, b) => a.deadline - b.deadline);
        }

        else if (chegando.length > 0 && tempoAtual === chegando[0].tempoChegada){
            while (chegando.length > 0 && tempoAtual === chegando[0].tempoChegada){
                prontos.push(chegando.shift());
            }
        }
        
        if(prontos[0].estado !== 1 && prontos[0].estado !== 3){
            prontos[0].estado = 1;
            if (fifoMemoriaAtivo){
                Fifo_Memoria(proc, prontos[0]);
            }
            else{
                Lru_Memoria(prontos[0]);
            }

        }
        if (prontos[0].deadline <= 0){
            prontos[0].estado = 3;
            
        }
        
        prontos[0].tempoExecucao--;
        q--;

        for (var k = 0; k < prontos.length; k++){
            prontos[k].deadline--;
        }

        atualizarProntos(proc, tempoAtual);
        avancarTempo(procCopia);
        await delay(valorslider);
        
        turnAround += prontos.length;

        if (prontos[0].tempoExecucao === 0){
            prontos[0].estado = -2;
            q = quantum;
            prontos.shift();
            prontos.sort((a, b) => a.deadline - b.deadline);
        }

        else if (q === 0){
            prontos[0].tempoChegada = tempoAtual;
            prontos[0].estado = 2;
            for (var j = 0; j < sobrecarga; j++){
                while (chegando.length > 0 && tempoAtual === chegando[0].tempoChegada){
                    prontos.push(chegando.shift());
                }
                for (var k = 0; k < prontos.length; k++){
                    prontos[k].deadline--;
                }
                atualizarProntos(proc, tempoAtual);
                avancarTempo(procCopia);
                await delay(valorslider);
                turnAround += prontos.length;
            }
            prontos[0].estado = 0;
            prontos.sort((a, b) => a.deadline - b.deadline);
            q = quantum;
        }

    }
    // Exibir o Turnaround Médio
    const turnaroundContainer = document.querySelector("#turnaroundContainer");
    const turnaroundValor = document.querySelector("#turnaroundValor");
    turnaroundValor.textContent = `${(turnAround / n).toFixed(2)}`;
    turnaroundContainer.style.display = "block";

    toggleButtons(false);
    return;

}





// RR com a lógica original e atualização dinâmica do gráfico
async function Round_Robin(proc, quantum, sobrecarga) {
    
    let procCopia = [...proc];
    tempoAtual = 0;// Reseta o tempo atual
    let prontos = [], chegando = [];
    let turnAround = 0;
    //let tempoDeFila = 0;
    let q = quantum;
    const n = proc.length;
    proc.sort((a, b) => a.tempoChegada - b.tempoChegada);
    atualizarProntos(proc, tempoAtual);
    for (var i = 0; i < proc.length; i++){
        chegando.push(proc[i])
    }

    while (chegando.length > 0 || prontos.length > 0) {
        while (prontos.length === 0 && chegando.length > 0 && chegando[0].tempoChegada > tempoAtual){
            avancarTempo(procCopia);
            await delay(valorslider);
        }
        
        while (chegando.length > 0 && tempoAtual === chegando[0].tempoChegada){
            prontos.push(chegando.shift());
        }
        
        if (prontos[0].estado !== 1) {
            prontos[0].estado = 1;
            if (fifoMemoriaAtivo){
                Fifo_Memoria(proc, prontos[0]);
            }
            else{
                Lru_Memoria(prontos[0]);
            }
        }
        
        prontos[0].tempoExecucao--;
        q--;

        atualizarProntos(proc, tempoAtual);
        avancarTempo(procCopia);
        await delay(valorslider);
        
        turnAround += prontos.length;

        if (prontos[0].tempoExecucao === 0){
            prontos[0].estado = -2;
            q = quantum;
            prontos.shift();
        }

        else if (q === 0){
            prontos[0].tempoChegada = tempoAtual;
            prontos[0].estado = 2;
            for (var j = 0; j < sobrecarga; j++){
                while (chegando.length > 0 && tempoAtual === chegando[0].tempoChegada){
                    prontos.push(chegando.shift());
                }
                atualizarProntos(proc, tempoAtual);
                avancarTempo(procCopia);
                await delay(valorslider);
                turnAround += prontos.length;
            }
            prontos[0].estado = 0;
            prontos.push(prontos.shift());
            q = quantum;
        }

    }
    // Exibir o Turnaround Médio
    const turnaroundContainer = document.querySelector("#turnaroundContainer");
    const turnaroundValor = document.querySelector("#turnaroundValor");
    turnaroundValor.textContent = `${(turnAround / n).toFixed(2)}`;
    turnaroundContainer.style.display = "block";
   
    toggleButtons(false);
    return;

}




window.onload = function () {
    criarMemoria("ram", RAM_SIZE);
    criarMemoria("disco", DISCO_SIZE);
    atualizarBotoesMemoria();
};

// Gerar gráfico ao clicar no botão
// --------------------------------FUNCOES DE CONTATO COM O USUARIO ----------------------------------------------------
document.getElementById("Fifo_Memoria").addEventListener("click", () => {
    if (!fifoMemoriaAtivo) {
        fifoMemoriaAtivo = true;
        lruMemoriaAtivo = false;
        atualizarBotoesMemoria();
    }
});

document.getElementById("Lru_Memoria").addEventListener("click", () => {
    if (!lruMemoriaAtivo) {
        lruMemoriaAtivo = true;
        fifoMemoriaAtivo = false;
        atualizarBotoesMemoria();
    }
});

document.getElementById("botaoFIFO").addEventListener("click", function () {
    toggleButtons(true, 'botaoFIFO'); // Desabilita botões imediatamente
    
    if (processos.length === 0) {
        alert("Adicione pelo menos um processo.");
        toggleButtons(false); // Reabilita botões em caso de erro
        
        return;
    }
    resetSimulacao(); // Reset;
    // Cria uma cópia do array de processos para ser usada no FIFO
    const processosCopia = processos.map(processo => ({ ...processo }));
    for (var i = 0; i < processos.length; i++){
    alocarProcessoNoDisco(processosCopia[i]);
    }
    atualizarRam();
    atualizarDisco();
    fifo(processosCopia); // Passa a cópia para o FIFO
    
});
document.getElementById("botaoSJF").addEventListener("click", function () {
    toggleButtons(true, 'botaoSJF'); // Desabilita botões imediatamente
    if (processos.length === 0) {
        alert("Adicione pelo menos um processo.");
        toggleButtons(false); // Reabilita botões em caso de erro
        
        return;
    }
    resetSimulacao(); // Reset;
    // Cria uma cópia do array de processos para ser usada no FIFO
    const processosCopia = processos.map(processo => ({ ...processo }));
    for (var i = 0; i < processos.length; i++){
        alocarProcessoNoDisco(processosCopia[i]);
    }
    atualizarRam();
    atualizarDisco();
    SJF(processosCopia); 
    
});
document.getElementById("botaoEDF").addEventListener("click", function () {
    toggleButtons(true, 'botaoEDF'); 
    const quantum = Number(quantumInput.value);
    const sobrecarga = Number(sobrecargaInput.value);
    if(quantum<=0){
        alert("Insira o valor do quantum.");
        toggleButtons(false); // Reabilita botões em caso de erro
        return;
    }else if (sobrecarga<1){
        alert("Insira o valor da sobrecarga.");
        toggleButtons(false); // Reabilita botões em caso de erro
        return;
    }
    if (processos.length === 0) {
        alert("Adicione pelo menos um processo.");
        toggleButtons(false); // Reabilita botões em caso de erro
        return;
    }
    resetSimulacao(); // Reset;
    // Cria uma cópia do array de processos para ser usada no FIFO
    const processosCopia = processos.map(processo => ({ ...processo }));
    for (var i = 0; i < processos.length; i++){
        alocarProcessoNoDisco(processosCopia[i]);
    }
    atualizarRam();
    atualizarDisco();
    
    edf(processosCopia, quantum, sobrecarga);
     // Passa a cópia para o FIFO

});
document.getElementById("botaoRoundRobin").addEventListener("click", function () {
    toggleButtons(true, 'botaoRoundRobin'); 
    toggleButtons(true); // Desabilita botões imediatamente
    const quantum = Number(quantumInput.value);
    const sobrecarga = Number(sobrecargaInput.value);
    if(quantum<=0){
        alert("Insira o valor do quantum.");
        toggleButtons(false); // Reabilita botões em caso de erro
        return;
    }else if (sobrecarga<1){
        alert("Insira o valor da sobrecarga.");
        toggleButtons(false); // Reabilita botões em caso de erro
        return;
    }
    if (processos.length === 0) {
        alert("Adicione pelo menos um processo.");
        toggleButtons(false); // Reabilita botões em caso de erro
        return;
        }
    resetSimulacao(); // Reset;
    const processosCopia = processos.map(processo => ({ ...processo }));
    for (var i = 0; i < processos.length; i++){
        alocarProcessoNoDisco(processosCopia[i]);
    }
    atualizarRam();
    atualizarDisco();
    Round_Robin(processosCopia, quantum, sobrecarga); 
    // Passa a cópia para o FIFO

});
// ------------------------FIM ----------------------------------------
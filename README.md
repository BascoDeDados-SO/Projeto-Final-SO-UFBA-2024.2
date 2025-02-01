# **Trabalho Final: "MATA58 - Sistemas Operacionais"**

### Grupo: Arthur Batzakas, Clóvis Carmo, Gabriel Sanches, Rafael Melo

Este Repositório contém o trabalho final da disciplina "MATA58 - Sistemas Operacionais" da Universidade Federal da Bahia, do semestre de 2024.2.
Para rodar o código, basta fazer o download dos arquivos "Final.js", "index.html" e "style.css" para uma mesma pasta e rodar o "index.html".

O trabalho final consiste num simulador de algoritmos de escalonamento de processos (FIFO, SJF, Round Robin e EDF) e algoritmos de substituição de páginas (FIFO e LRU), implementado em javascript. 
O usuário pode adicionar processos à lista depois de preencher os campos de tempo de chegada, tempo de execução, deadline e número de páginas. 
Depois de adicionado à lista, um processo pode ser removido ou editado por meio de um botão ao seu lado. Depois de adicionar os processos desejados, o usuário pode informar o quantum e a sobrecarga (caso deseje simular um dos algoritmos preemptivos de escalonamento de processos),
selecionar o algoritmo de substituição de páginas, e clicar no botão correspondente ao algoritmo de escalonamento que será simulado. Um gráfico de Gantt será gerado com um tamanho pré-definido e demonstrará passo a passo se os processos estão inativos, em execução, em espera, em sobrecarga ou em estouro de deadline (para o EDF). O usuário pode controlar o tempo de atualização do gráfico por meio de um botão de controle deslizante.
Ao final da simulação, fazemos o display do turnaround médio (tempo de execução médio) da simulação. Depois de finalizado, o usuário então pode escolher realizar outras simulações, seguindo o mesmo esquema.

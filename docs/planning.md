# Plano de evolução do StackFighters

## Milestones

### Milestone 1 — Sistema de combate avançado
- Refinar estados dos lutadores e sincronização online.
- Adicionar novos golpes, como especiais carregados e projéteis.
- Melhorar feedback visual/sonoro de acertos e bloqueios.

### Milestone 2 — Conteúdo de personagens
- Criar novos lutadores com variação de atributos.
- Implementar seletores de personagem e espelhamento de skins.
- Balancear valores de dano, stun e ganho de energia especial.

### Milestone 3 — Experiência online
- Persistir estatísticas de partidas no servidor.
- Introduzir salas privadas e matchmaking básico.
- Monitorar latência e aplicar interpolação/suavização.

## Issues propostas

1. **Adicionar animações e efeitos para estados recém-criados**  
   Atualizar spritesheets ou placeholders para cobrir dash, agachamento e especial.

2. **Refinar IA local para utilizar novas mecânicas**  
   Permitir que o oponente controlado pelo jogo use dash, bloqueio e especiais de forma situacional.

3. **Aprimorar HUD com indicadores de vantagem e dicas contextuais**  
   Mostrar mensagens quando o especial estiver disponível ou quando um jogador vencer o round decisivo.

4. **Criar testes de integração para sincronização de estado**  
   Garantir que as novas propriedades (estado, especial) estejam chegando corretamente via rede.

5. **Documentar comandos e combos avançados no README**  
   Atualizar documentação com a lista completa de inputs, incluindo dash e especial.


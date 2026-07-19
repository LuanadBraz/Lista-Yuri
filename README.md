# Lista de compras do Yuri — versão atualizada

Aplicação feita com HTML, CSS e JavaScript.

## Alterações desta versão

- Topo menor e mais compacto.
- Botão **Reservar** ao lado de **Marcar como comprado**.
- A pessoa informa o nome em uma janela de reserva.
- O nome fica visível no item: `Reservado por Nome`.
- A reserva pode ser cancelada.
- Compras e reservas ficam salvas no navegador.
- Foram adicionados:
  - Babadores
  - Mijões (calças) RN e P
  - Macacão RN e P
  - Protetor de colchão impermeável
- Fotos de produtos carregadas pela internet.

## Como abrir

1. Extraia o ZIP.
2. Abra `index.html`.
3. É necessário estar conectado à internet para carregar as fontes e as fotos.

## Alterar telefone

No final de `index.html`, procure:

```html
<a href="tel:+5511000000000">Telefone: (11) 00000-0000</a>
```

Troque o telefone exibido e o número dentro de `tel:`.

## Publicação

Os arquivos podem ser publicados no GitHub Pages, Netlify, Vercel ou hospedagem comum.


## Correção desta versão

- Quando um item é reservado, o botão **Marcar como comprado** fica desabilitado.
- Para habilitar novamente, é necessário clicar em **Cancelar reserva**.
- As imagens enviadas foram incluídas na pasta `img`, portanto não dependem de links externos.
- As imagens de Sling e protetor de colchão continuam usando as imagens anteriores, pois não foram enviadas novas imagens para esses itens.

with open('/home/claude/poemas/autorais/pessoa.css', 'r') as f:
    css = f.read()

old = """/* ── FOLHA DO POEMA — papel velho, manchado, jogado ── */
.poema {
  position: relative;
  padding: 60px 58px 52px;

  /* papel envelhecido com manchas e fibras */
  background-color: #ede0c0;
  background-image:
    url('https://www.transparenttextures.com/patterns/paper-fibers.png'),
    url('https://www.transparenttextures.com/patterns/cream-paper.png');

  /* sombra de papel sobre superfície */
  box-shadow:
    0 6px 28px rgba(0,0,0,0.22),
    0 2px 6px rgba(0,0,0,0.14),
    inset 0 0 80px rgba(160,120,60,0.18),
    inset 0 0 20px rgba(100,70,20,0.10);
}"""

new = """/* ── FOLHA DO POEMA — papel velho amarelado, amassado ── */
.poema {
  position: relative;
  padding: 60px 58px 52px;

  /* base: amarelo envelhecido */
  background-color: #d4b87a;
  background-image:
    /* vincos de amassado — linhas diagonais cruzadas sutis */
    repeating-linear-gradient(
      127deg,
      transparent 0px, transparent 22px,
      rgba(0,0,0,0.03) 22px, rgba(0,0,0,0.03) 23px
    ),
    repeating-linear-gradient(
      53deg,
      transparent 0px, transparent 38px,
      rgba(255,255,255,0.05) 38px, rgba(255,255,255,0.05) 39px
    ),
    /* manchas de envelhecimento distribuídas */
    radial-gradient(ellipse at 12% 20%, rgba(160,110,30,0.25) 0%, transparent 40%),
    radial-gradient(ellipse at 88% 75%, rgba(130,90,20,0.20) 0%, transparent 35%),
    radial-gradient(ellipse at 55% 8%,  rgba(180,140,50,0.18) 0%, transparent 30%),
    radial-gradient(ellipse at 30% 90%, rgba(110,75,15,0.15) 0%, transparent 28%),
    radial-gradient(ellipse at 75% 40%, rgba(200,160,70,0.12) 0%, transparent 35%),
    /* textura de fibras reais de papel */
    url('https://www.transparenttextures.com/patterns/paper-fibers.png'),
    url('https://www.transparenttextures.com/patterns/beige-paper.png');

  box-shadow:
    0 6px 28px rgba(0,0,0,0.26),
    0 2px 8px rgba(0,0,0,0.16),
    inset 0 0 100px rgba(120,80,10,0.22),
    inset 0 0 30px rgba(70,40,5,0.14);
}"""

css = css.replace(old, new)
with open('/home/claude/poemas/autorais/pessoa.css', 'w') as f:
    f.write(css)
print("done", "replaced" if new[:30] in css else "NOT replaced")

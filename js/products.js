/* =========================================================
   STORE CONFIG + CATALOG
   Edit this file only to change brand, WhatsApp or products.
   ========================================================= */
window.STORE = {
  name: "ANZAR STEP",
  tagline: "Classic shoes, beautifully aged.",
  whatsapp: "212679466809",          // international format, no "+" or spaces
  email: "anzarsupport@gmail.com",
  instagram: "https://www.instagram.com/anzar_step",
  tiktok: "https://www.tiktok.com/@anzarstep",
  facebook: "https://www.facebook.com/profile.php?id=61584317997419",
  currency: "DH",
  delivery: "24 - 72h",
  shippingFee: 0                     // 0 = livraison gratuite
};

(function () {
  const IMG = "https://anzarstep.com/api/local-assets/products/";
  window.ASSETS = "https://anzarstep.com/";
  const SIZES = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46];
  const p = (files) => files.map((f) => IMG + f);

  window.PRODUCTS = [
    {
      id: "zebra",
      name: "ZEBRA",
      code: "AS-01",
      category: "shoes",
      price: 299,
      oldPrice: 350,
      stock: 11,
      tag: "Tendance",
      desc: "Un mocassin slip-on audacieux à la finition texturée noir et blanc. Intérieur rembourré pour un confort du matin au soir.",
      specs: ["Slip-on", "Texture zebra noir/blanc", "Intérieur rembourré", "Fait main au Maroc"],
      sizes: SIZES,
      images: p([
        "1790337114360-dteoudin.jpeg", "1790337124075-e4ee6lkj.jpeg", "1790337128182-mv8uhpdv.PNG",
        "1790337132951-lw759lwr.jpeg", "1790337137772-5rdxoitv.PNG", "1790337140792-2ztfwmyv.PNG",
        "1790337144595-ck0j0a3h.PNG"
      ])
    },
    {
      id: "chunky-brownie-90s",
      name: "Chunky Brownie 90s",
      code: "AS-02",
      category: "shoes",
      price: 299,
      oldPrice: 350,
      stock: 22,
      tag: "Rétro",
      desc: "Un mocassin inspiré des années 90, monté sur une semelle chunky affirmée, dans un brun chocolat profond.",
      specs: ["Semelle chunky", "Marron chocolat", "Style 90s", "Cuir véritable"],
      sizes: SIZES,
      images: p([
        "1790334765149-ubkmpley.jpeg", "1790334767694-w0b0ud8a.jpeg", "1790334771868-avqg244b.PNG",
        "1790334782910-n513id6y.PNG", "1790334786725-35xevzrs.PNG", "1790334789113-9hcq4m6t.jpeg",
        "1790334791476-ysw9u8se.PNG"
      ])
    },
    {
      id: "atlass-98",
      name: "Atlass 98",
      code: "AS-03",
      category: "shoes",
      price: 319,
      oldPrice: 400,
      stock: 35,
      tag: "Best-seller",
      desc: "Une tige derby en cuir classique sur une semelle plateforme robuste à forte adhérence. Le classique, revisité.",
      specs: ["Derby cuir", "Semelle plateforme", "Haute adhérence", "Fait main au Maroc"],
      sizes: SIZES,
      images: p([
        "1790334648291-de8k79i1.jpeg", "1790334660870-lgmlb6nu.PNG", "1790334664135-57qji2bc.jpeg",
        "1790334666998-sgrrb276.jpeg", "1790334670821-0cw6oaum.jpeg", "1790334674418-mumrzicx.PNG",
        "1790334676658-2igcbzvw.jpeg"
      ])
    },
    {
      id: "shadow-step",
      name: "Shadow Step",
      code: "AS-04",
      category: "shoes",
      price: 299,
      oldPrice: 350,
      stock: 21,
      tag: "Classique",
      desc: "Le penny loafer noir intemporel : bride sur l'empeigne et semelle crantée chunky pour une allure moderne.",
      specs: ["Penny loafer", "Noir profond", "Semelle crantée", "Cuir véritable"],
      sizes: SIZES,
      images: p([
        "1790334279880-5njnt5pw.jpeg", "1790334303022-ut2av33e.jpeg", "1790334313620-wz1zanua.jpeg",
        "1790334319851-h1bdzbcq.jpeg", "1790334329984-68o2oec5.PNG", "1790334529643-ekvbluen.jpeg",
        "1790334532103-ng19v6zg.PNG"
      ])
    },
    {
      id: "naruto",
      name: "NARUTO",
      code: "AS-05",
      category: "sandals",
      price: 299,
      oldPrice: 450,
      stock: 26,
      tag: "Édition custom",
      desc: "Sabot personnalisé peint à la main, orné de flammes et de détails ninja. Une pièce à l'esprit anime.",
      specs: ["Sabot personnalisé", "Peint à la main", "Flammes & détails ninja", "Semelle confort"],
      sizes: SIZES,
      images: p([
        "1790337415412-z54h10jn.jpeg", "1790337431210-5pkoj1no.jpeg", "1790337438020-27kciwxo.jpeg",
        "1790337440095-uorp99uv.jpeg", "1790337442398-7ii93ejj.jpeg", "1790337444441-hstjdkzq.jpeg"
      ])
    },
    {
      id: "sonic",
      name: "SONIC",
      code: "AS-06",
      category: "sandals",
      price: 299,
      oldPrice: 450,
      stock: 15,
      tag: "Édition custom",
      desc: "Sabot personnalisé aux accents bleus et aux détails nets, pour une allure pleine d'énergie.",
      specs: ["Sabot personnalisé", "Accents bleus", "Peint à la main", "Semelle confort"],
      sizes: SIZES,
      images: p([
        "1790336135961-4fiqu87m.jpeg", "1790336147603-8zej0de5.jpeg", "1790336153646-8cqcgtfl.jpeg",
        "1790336158226-uftl7smo.jpeg", "1790336172232-0lhhz62o.jpeg", "1790336176116-jy0cnpn6.jpeg",
        "1790336178409-wzytt9q5.jpeg"
      ])
    },
    {
      id: "love",
      name: "LOVE",
      code: "AS-07",
      category: "sandals",
      price: 299,
      oldPrice: 450,
      stock: 200,
      tag: "Édition custom",
      desc: "Sabot personnalisé rose, décoré d'un motif flammes et d'une calligraphie \"Love\" ornementale.",
      specs: ["Sabot personnalisé", "Rose", "Art flames + script Love", "Semelle confort"],
      sizes: SIZES,
      images: p([
        "1790335846069-m8ymizif.jpeg", "1790335853537-yj4q23kk.jpeg", "1790335857912-9jiiyhy3.jpeg",
        "1790335860758-99wbolti.jpeg", "1790335864790-k1m3akb6.jpeg", "1790335867396-5qpzy774.jpeg",
        "1790335869442-7y54jjhb.jpeg"
      ])
    }
  ];

  window.CATEGORIES = [
    { id: "all", label: "Tout" },
    { id: "shoes", label: "Chaussures" },
    { id: "sandals", label: "Sandales & Sabots" }
  ];
})();

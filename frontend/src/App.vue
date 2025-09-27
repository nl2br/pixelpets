<script setup>
import { ref, onMounted } from 'vue'

const pets = ref([])
const loading = ref(false)
const form = ref({ name:'', species:'axolotl' })
const talk = ref({ name:'Mochi', species:'axolotl', mood:'joueur', message:'Tu veux jouer ?' })
const aiReply = ref('')

async function fetchPets() {
  loading.value = true
  try {
    const r = await fetch('/api/pets')
    pets.value = await r.json()
  } finally { loading.value = false }
}

async function createPet() {
  const r = await fetch('/api/pets', {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify(form.value)
  })
  if (r.ok) {
    form.value.name = ''
    await fetchPets()
  } else {
    alert('Erreur création pet')
  }
}

async function suggestName() {
  const q = new URLSearchParams({ species: form.value.species || 'pet' })
  const r = await fetch(`/api/ai/suggest-name?${q}`)
  const data = await r.json()
  if (Array.isArray(data.names) && data.names.length) form.value.name = data.names[0]
}

async function talkAI() {
  aiReply.value = '...'
  const r = await fetch('/api/ai/talk', {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify(talk.value)
  })
  const data = await r.json()
  aiReply.value = data.reply || '(pas de réponse)'
}

onMounted(fetchPets)
</script>

<template>
  <main style="max-width:900px;margin:24px auto;font-family:system-ui,Segoe UI,Roboto,Arial">
    <h1>🐾 PixelPets — Front</h1>
    <section style="display:grid;gap:12px;margin:16px 0;padding:12px;border:1px solid #ddd;border-radius:10px">
      <h2 style="margin:0">Créer un pet</h2>
      <label>Nom
        <input v-model="form.name" placeholder="Nom" style="margin-left:8px;padding:6px"/>
      </label>
      <label>Espèce
        <input v-model="form.species" placeholder="axolotl" style="margin-left:8px;padding:6px"/>
      </label>
      <div style="display:flex; gap:8px;">
        <button @click="createPet">Créer</button>
        <button @click="suggestName">Suggérer un nom (IA)</button>
      </div>
    </section>

    <section style="display:grid;gap:12px;margin:16px 0;padding:12px;border:1px solid #ddd;border-radius:10px">
      <h2 style="margin:0">Parler comme un pet (IA)</h2>
      <div style="display:flex; gap:8px; flex-wrap: wrap;">
        <input v-model="talk.name" placeholder="Nom" />
        <input v-model="talk.species" placeholder="Espèce" />
        <input v-model="talk.mood" placeholder="Humeur (joyeux, joueur...)" />
      </div>
      <textarea v-model="talk.message" placeholder="Message" rows="2"></textarea>
      <button @click="talkAI">Parler</button>
      <div v-if="aiReply" style="padding:8px;background:#f7f7f7;border-radius:8px">
        <strong>Réponse:</strong> {{ aiReply }}
      </div>
    </section>

    <section style="margin:16px 0;padding:12px;border:1px solid #ddd;border-radius:10px">
      <h2 style="margin-top:0">Liste des pets</h2>
      <div v-if="loading">Chargement...</div>
      <ul v-else>
        <li v-for="p in pets" :key="p.id">
          <strong>#{{ p.id }}</strong> {{ p.name }} — <em>{{ p.species }}</em> <small>({{ p.createdAt }})</small>
        </li>
      </ul>
      <button @click="fetchPets">Rafraîchir</button>
    </section>
  </main>
</template>

<style>
button { padding:8px 12px; border-radius:8px; border:1px solid #ccc; background:#fff; cursor:pointer }
input, textarea { padding:8px; border:1px solid #ccc; border-radius:6px; }
</style>

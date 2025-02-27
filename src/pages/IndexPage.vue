<template>
  <q-page class="q-pa-md">
    <q-table
      :rows="teams"
      :columns="columns"
      row-key="id"
      :rows-per-page-options="[10, 20, 50]"
      :pagination="initialPagination"
    />
  </q-page>
</template>

<script>
import { db } from 'src/firebase.js';
import { collection, onSnapshot } from 'firebase/firestore';

export default {
  data() {
    return {
      teams: [],
      initialPagination: { rowsPerPage: 10 },
      columns: [
        { name: 'team', label: 'Team Name', field: 'team', align: 'left' },
        { name: 'finalScore', label: 'Final Score', field: 'finalScore' }
      ]
    };
  },
  mounted() {
    onSnapshot(collection(db, 'teams'), (snapshot) => {
      this.teams = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    });
  }
};
</script>

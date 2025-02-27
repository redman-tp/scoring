<template>
  <q-page class="q-pa-md">
    <q-btn label="Add Team" color="secondary" @click="addTeam" />
    <q-btn label="Calculate All" color="secondary" class="q-mr-md" @click="calculateAll" />
    <q-btn label="Toggle Reveal Scores" color="info" @click="externalFunction" />
  </q-page>
</template>

<script>
import { db } from "src/firebase.js";
import { collection, addDoc } from "firebase/firestore";
import { useQuasar } from "quasar";

export default {
  setup() {

const emit = defineEmits(['external_function']);

const externalFunction = () =>{
  emit('external_function')
}

    const $q = useQuasar();

    const addTeam = () => {
      $q.dialog({
        title: "Add Team",
        prompt: { model: "", isValid: val => val.length > 0 },
        cancel: true,
        persistent: true
      }).onOk(async (teamName) => {
        await addDoc(collection(db, "teams"), {
          team: teamName,
          problem_solution: 0,
          viability: 0,
          alignment: 0,
          pitch: 0,
          investor: 0,
          total: 0,
          calculated: false
        });
      });
    };

   const calculateAll = async () => {
      // For each team, compute overall average from all judge submissions.
      for (const team of this.teams) {
        if (team.judgeScores && Object.keys(team.judgeScores).length > 0) {
          let sum = 0;
          let count = 0;
          for (const judge in team.judgeScores) {
            sum += team.judgeScores[judge].total;
            count++;
          }
          const avg = Number((sum / count).toFixed(1));
          team.finalScore = avg;
          try {
            const teamRef = doc(db, "teams", team.id);
            await updateDoc(teamRef, { finalScore: avg });
            console.log(`Final score for ${team.team}:`, avg);
          } catch (error) {
            console.error("Error updating final score:", error);
          }
        }
      }
    }

    return { addTeam, calculateAll, externalFunction };
  }
};
</script>

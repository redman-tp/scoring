<template>
  <q-page class="q-pa-md">
    <div class="q-mb-md">
      <!-- <q-btn label="Calculate All" color="secondary" class="q-mr-md" @click="calculateAll" /> -->
      <q-btn label="Toggle Reveal Scores" color="info" @click="toggleRevealScores" />
    </div>

    <q-table
      :rows="teams"
      :columns="columns"
      row-key="id"
      :rows-per-page-options="[10, 20, 50]"
      :pagination="initialPagination"
    >
      <template v-slot:body-cell="props">
        <q-td :props="props">
          <!-- Team Name -->
          <template v-if="props.col.name === 'team'">
            {{ props.row.team }}
          </template>

          <!-- Input fields for scoring; disabled if the judge already submitted -->
          <template v-else-if="props.col.name === 'problem_solution'">
            <q-input
              v-model.number="props.row.temp_problem_solution"
              type="number"
              min="0"
              max="20"
              :disable="judgeHasSubmitted(props.row)"
            />
          </template>
          <template v-else-if="props.col.name === 'viability'">
            <q-input
              v-model.number="props.row.temp_viability"
              type="number"
              min="0"
              max="20"
              :disable="judgeHasSubmitted(props.row)"
            />
          </template>
          <template v-else-if="props.col.name === 'alignment'">
            <q-input
              v-model.number="props.row.temp_alignment"
              type="number"
              min="0"
              max="20"
              :disable="judgeHasSubmitted(props.row)"
            />
          </template>
          <template v-else-if="props.col.name === 'pitch'">
            <q-input
              v-model.number="props.row.temp_pitch"
              type="number"
              min="0"
              max="20"
              :disable="judgeHasSubmitted(props.row)"
            />
          </template>
          <template v-else-if="props.col.name === 'investor'">
            <q-input
              v-model.number="props.row.temp_investor"
              type="number"
              min="0"
              max="20"
              :disable="judgeHasSubmitted(props.row)"
            />
          </template>

          <!-- Total Column: show finalScore if available, otherwise list judge scores (asterisked unless revealed) -->
          <template v-else-if="props.col.name === 'total'">
            <div v-if="props.row.finalScore !== null">
              {{ props.row.finalScore }}
            </div>
            <div v-else>
              <div v-for="(score, judge) in props.row.judgeScores" :key="judge">
                {{ judge }}: {{ revealScores ? score.total : '*' }}
              </div>
            </div>
          </template>
        </q-td>
      </template>

      <!-- Action Column: Judge's Calculate button (disabled if already submitted) -->
      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn
            label="Calculate"
            color="primary"
            :disable="judgeHasSubmitted(props.row)"
            @click="submitJudgeScore(props.row)"
          />
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script>
import { db } from "src/firebase.js";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { ref, onMounted, onUnmounted } from 'vue';

export default {
  data() {
    return {
      judgeID: null, // Judge's unique identifier (username)
      revealScores: false, // Toggle for revealing actual scores
      teams: [],
      initialPagination: { rowsPerPage: 10 },
      columns: [
        { name: "team", label: "Team Name", field: "team", align: "left" },
        { name: "problem_solution", label: "Problem-Solution Fit (20%)", field: "temp_problem_solution" },
        { name: "viability", label: "Viability & Scalability (20%)", field: "temp_viability" },
        { name: "alignment", label: "Alignment (20%)", field: "temp_alignment" },
        { name: "pitch", label: "Pitch Delivery (20%)", field: "temp_pitch" },
        { name: "investor", label: "Investor Readiness (20%)", field: "temp_investor" },
        { name: "total", label: "Total", field: "total" },
        { name: "actions", label: "Actions", field: "actions" }
      ]
    };
  },
  methods: {
    promptJudgeID() {
      this.$q.dialog({
        title: "Enter your username",
        prompt: { model: "", isValid: val => val && val.length > 0 },
        persistent: true
      }).onOk(val => {
        this.judgeID = val;
        localStorage.setItem("judgeID", val);
      });
    },
    judgeHasSubmitted(team) {
      // Judge is considered to have submitted if a final score is set
      // OR if the judge's score exists and is marked as calculated.
      return team.finalScore !== null ||
        (team.judgeScores &&
         this.judgeID &&
         team.judgeScores[this.judgeID] &&
         team.judgeScores[this.judgeID].calculated === true);
    },
    async submitJudgeScore(team) {
      if (!this.judgeID) {
        this.promptJudgeID();
        return;
      }

      // Confirm submission before processing
      this.$q.dialog({
        title: "Confirm Score Submission",
        message: "Are you sure you want to submit your score for this team? Once submitted, you cannot modify your score.",
        cancel: true,
        persistent: true
      }).onOk(async () => {
        // Calculate this judge's total score from temporary inputs
        let sum =
          team.temp_problem_solution +
          team.temp_viability +
          team.temp_alignment +
          team.temp_pitch +
          team.temp_investor;
        const judgeTotal = Number(sum.toFixed(1));

        // Build a score object for the current judge and mark as calculated
        const scoreObj = {
          problem_solution: team.temp_problem_solution,
          viability: team.temp_viability,
          alignment: team.temp_alignment,
          pitch: team.temp_pitch,
          investor: team.temp_investor,
          total: judgeTotal,
          calculated: true
        };

        // Initialize judgeScores if not present and store the score under the judge's ID
        if (!team.judgeScores) {
          team.judgeScores = {};
        }
        team.judgeScores[this.judgeID] = scoreObj;

        // Clear temporary inputs
        team.temp_problem_solution = 0;
        team.temp_viability = 0;
        team.temp_alignment = 0;
        team.temp_pitch = 0;
        team.temp_investor = 0;

        try {
          const teamRef = doc(db, "teams", team.id);
          await updateDoc(teamRef, {
            [`judgeScores.${this.judgeID}`]: scoreObj
          });
          console.log("Score submitted for judge", this.judgeID, "for team", team.team);
        } catch (error) {
          console.error("Error updating team judge score:", error);
        }
      });
    },
    // async calculateAll() {
    //   // For each team, compute overall average from all judge submissions.
    //   for (const team of this.teams) {
    //     if (team.judgeScores && Object.keys(team.judgeScores).length > 0) {
    //       let sum = 0;
    //       let count = 0;
    //       for (const judge in team.judgeScores) {
    //         sum += team.judgeScores[judge].total;
    //         count++;
    //       }
    //       const avg = Number((sum / count).toFixed(1));
    //       team.finalScore = avg;
    //       try {
    //         const teamRef = doc(db, "teams", team.id);
    //         await updateDoc(teamRef, { finalScore: avg });
    //         console.log(`Final score for ${team.team}:`, avg);
    //       } catch (error) {
    //         console.error("Error updating final score:", error);
    //       }
    //     }
    //   }
    // },
    toggleRevealScores() {
      this.revealScores = !this.revealScores;
    }
  },
  mounted() {
    // Retrieve judgeID from localStorage or prompt if not set
    const storedJudge = localStorage.getItem("judgeID");
    if (storedJudge) {
      this.judgeID = storedJudge;
    } else {
      this.promptJudgeID();
    }
    // Listen for teams updates from Firestore
    onSnapshot(collection(db, "teams"), (snapshot) => {
      this.teams = snapshot.docs.map((doc) => {
        let data = doc.data();
        // Initialize temporary fields with the judge's previously submitted scores if available, else 0
        data.temp_problem_solution =
          data.judgeScores && this.judgeID && data.judgeScores[this.judgeID]
            ? data.judgeScores[this.judgeID].problem_solution
            : 0;
        data.temp_viability =
          data.judgeScores && this.judgeID && data.judgeScores[this.judgeID]
            ? data.judgeScores[this.judgeID].viability
            : 0;
        data.temp_alignment =
          data.judgeScores && this.judgeID && data.judgeScores[this.judgeID]
            ? data.judgeScores[this.judgeID].alignment
            : 0;
        data.temp_pitch =
          data.judgeScores && this.judgeID && data.judgeScores[this.judgeID]
            ? data.judgeScores[this.judgeID].pitch
            : 0;
        data.temp_investor =
          data.judgeScores && this.judgeID && data.judgeScores[this.judgeID]
            ? data.judgeScores[this.judgeID].investor
            : 0;
        data.finalScore = data.finalScore !== undefined ? data.finalScore : null;
        if (!data.judgeScores) {
          data.judgeScores = {};
        }
        return { id: doc.id, ...data };
      });
    });
  }
};
</script>

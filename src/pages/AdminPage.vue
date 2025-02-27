<template>
  <q-page class="q-pa-md">
    <div class="q-mb-md">
      <q-input
        v-model.number="numJudges"
        type="number"
        label="Number of Judges"
        filled
        dense
      />
      <q-btn
        label="Apply Judges"
        color="primary"
        class="q-ml-md"
        @click="applyJudges"
      />
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
          <template v-if="props.col.name === 'team'">
            {{ props.row.team }}
          </template>
          <template v-else-if="props.col.name === 'total'">
            {{ props.row.total }}
          </template>
          <template v-else>
            <q-input
              v-model.number="props.row[props.col.name]"
              type="number"
              min="0"
              max="10"
              :disable="props.row.calculated"
            />
          </template>
        </q-td>
      </template>
      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn
            label="Calculate"
            color="primary"
            :disable="props.row.calculated"
            @click="confirmCalculation(props.row)"
          />
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script>
import { db } from "src/firebase.js";
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";

export default {
  data() {
    return {
      teams: [],
      numJudges: 1,
      initialPagination: { rowsPerPage: 10 },
      columns: [
        { name: "team", label: "Team Name", field: "team", align: "left" },
        {
          name: "problem_solution",
          label: "Problem-Solution Fit (20%)",
          field: "problem_solution",
        },
        {
          name: "viability",
          label: "Viability & Scalability (20%)",
          field: "viability",
        },
        { name: "alignment", label: "Alignment (20%)", field: "alignment" },
        { name: "pitch", label: "Pitch Delivery (20%)", field: "pitch" },
        {
          name: "investor",
          label: "Investor Readiness (20%)",
          field: "investor",
        },
        { name: "total", label: "Total (100%)", field: "total" },
        { name: "actions", label: "Actions", field: "actions" },
      ],
    };
  },
  methods: {
    async addTeam() {
      this.$q
        .dialog({
          title: "Add Team",
          prompt: { model: "", isValid: (val) => val.length > 0 },
          cancel: true,
          persistent: true,
        })
        .onOk(async (teamName) => {
          try {
            const docRef = await addDoc(collection(db, "teams"), {
              team: teamName,
              problem_solution: 0,
              viability: 0,
              alignment: 0,
              pitch: 0,
              investor: 0,
              total: 0,
              calculated: false,
            });
            console.log("Team added with ID:", docRef.id);
          } catch (error) {
            console.error("Error adding team:", error);
          }
        });
    },
    confirmCalculation(row) {
      this.$q
        .dialog({
          title: "Confirm Calculation",
          message: "Once calculated, this row cannot be edited. Proceed?",
          cancel: true,
          persistent: true,
        })
        .onOk(() => {
          this.calculateTotal(row);
        });
    },
    async calculateTotal(row) {
      let sum =
        row.problem_solution +
        row.viability +
        row.alignment +
        row.pitch +
        row.investor;
        row.total = Number((sum).toFixed(1));
        // Rounds to 1 decimal place
      row.calculated = true;

      try {
        const teamRef = doc(db, "teams", row.id);
        await updateDoc(teamRef, {
          problem_solution: row.problem_solution,
          viability: row.viability,
          alignment: row.alignment,
          pitch: row.pitch,
          investor: row.investor,
          total: row.total, // Ensuring it's stored as a number
          calculated: true,
        });
        console.log("Team updated successfully!");
      } catch (error) {
        console.error("Error updating team:", error);
      }
    },

    applyJudges() {
      if (this.numJudges > 0) {
        this.teams.forEach(async (team) => {
          if (team.calculated) {
            const adjustedTotal = parseFloat((team.total / this.numJudges).toFixed(1));

            console.log(adjustedTotal)
            // adjustedTotal = Number((adjustedTotal).toFixed(1));

            try {
              const teamRef = doc(db, "teams", team.id);
              await updateDoc(teamRef, { total: adjustedTotal });
            } catch (error) {
              console.error("Error updating team total:", error);
            }
          }
        });
      }
    },
  },
  mounted() {
    onSnapshot(collection(db, "teams"), (snapshot) => {
      this.teams = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    });
  },
};
</script>

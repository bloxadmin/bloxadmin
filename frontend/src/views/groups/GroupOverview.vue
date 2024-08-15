<template>
  <h2>{{ group.name }}</h2>
  <p>This is the Group overview</p>
  <GroupMembers :groupIdentifier="groupIdentifier" />
  <h3>Notes</h3>
  <div class="notes">
    <form :onSubmit="newNote">
      <input class="new-note" placeholder="New Note" v-model="newNoteText" />
    </form>
    <div class="note" v-for="note in notes?.data">
      <p class="sender">
        <DisplayPlayer group :player="note.user" />
        <span>{{ formatTimeAgo(new Date(note.createdAt).getTime()) }}</span>
      </p>
      <p>{{ note.note }}</p>
    </div>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import GroupMembers from '../../components/groups/GroupMembers.vue';
import DisplayPlayer from '../../components/players/DisplayPlayer.vue';
import { Note, Paginated, UserGroup, getGroupNotes, postGroupNote } from '../../lib/bloxadmin';
import { formatTimeAgo } from '../../lib/format';

interface Props {
  groupIdentifier: string;
  group: UserGroup;
}

const props = defineProps<Props>();

const notes = ref<Paginated<Note> | null>(null);
const newNoteText = ref<string>('');

const newNote = async (e: Event) => {
  e.preventDefault();
  if (!notes.value) {
    return;
  }

  const newNote = await postGroupNote(props.groupIdentifier, newNoteText.value);

  if (!newNote.body) {
    return;
  }

  notes.value = {
    limit: notes.value.limit,
    skip: notes.value.skip,
    total: notes.value.total + 1,
    data: [newNote.body, ...notes.value.data],
  }
  newNoteText.value = '';
}

onMounted(async () => {
  const body = await getGroupNotes(props.groupIdentifier);

  if (!body.body) {
    return;
  }

  notes.value = body.body;
});
</script>
<style scoped lang="scss">
input.new-note {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  background-color: var(--foreground);
  border-radius: 5px;
}

.notes {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.note {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: var(--white);
  border-radius: 5px;

  .sender {
    display: flex;
    justify-content: space-between;
  }
}
</style>

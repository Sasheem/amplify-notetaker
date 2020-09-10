import React, { useState, useEffect } from 'react';
import { API, graphqlOperation } from 'aws-amplify';
import { withAuthenticator } from 'aws-amplify-react';
import { createNote, deleteNote, updateNote } from './graphql/mutations';
import { listNotes } from './graphql/queries';
import { onCreateNote } from './graphql/subscriptions';

import '@aws-amplify/ui/dist/style.css';

function App() {
	const [id, setId] = useState('');
	const [note, setNote] = useState('');
	const [notes, setNotes] = useState([]);

	const handleChangeNote = (event) => setNote(event.target.value);

	const handleAddNote = async (event) => {
		event.preventDefault();
		// check for existing note, if yes update it
		if (hasExistingNote()) {
			handleUpdateNote();
			console.log('note updated!');
		} else {
			const input = { note };
			await API.graphql(graphqlOperation(createNote, { input }));
			// const newNote = result.data.createNote;
			// setNotes([...notes, newNote]);
			setNote('');
			// setId('');
		}
	};

	const handleUpdateNote = async () => {
		const input = { id, note };
		const result = await API.graphql(graphqlOperation(updateNote, { input }));
		const updatedNote = result.data.updateNote;
		const index = notes.findIndex((note) => note.id === updatedNote.id);
		const updatedNotes = [
			...notes.slice(0, index),
			updatedNote,
			...notes.slice(index + 1),
		];
		setNotes(updatedNotes);
		setNote('');
		setId('');
	};

	const handleDeleteNote = async (noteId) => {
		const input = { id: noteId };
		const result = await API.graphql(graphqlOperation(deleteNote, { input }));
		const deletedNoteId = result.data.deleteNote.id;
		const updatedNotes = notes.filter((note) => note.id !== deletedNoteId);
		setNotes(updatedNotes);
	};

	const handleSetNote = ({ note, id }) => {
		setNote(note);
		setId(id);
	};

	// fetch data
	useEffect(() => {
		// async function fetchNotes() {
		// 	const result = await API.graphql(graphqlOperation(listNotes));
		// 	setNotes(result.data.listNotes.items);
		// }

		// fetchNotes();
		getNotes();
	}, []);

	// onCreateNote Subscription
	useEffect(() => {
		const onCreateSubscription = API.graphql(
			graphqlOperation(onCreateNote)
		).subscribe({
			next: (noteData) => {
				const newNote = noteData.value.data.onCreateNote;
				const prevNotes = notes.filter((note) => note.id !== newNote.id);
				console.log(prevNotes);
				setNotes([...prevNotes, newNote]);
				console.log(notes);
			},
		});

		return () => {
			if (onCreateSubscription) {
				onCreateSubscription.unsubscribe();
			}
		};
	}, [notes]);

	/**
	 * helper function
	 */
	const getNotes = async () => {
		const result = await API.graphql(graphqlOperation(listNotes));
		setNotes(result.data.listNotes.items);
	};

	/**
	 * helper function
	 * returns boolean if index is valid and exists in notes state
	 */
	const hasExistingNote = () => {
		if (id) {
			// check if id is valid
			// findIndex returns positive value if item is found, returns -1 OW
			const isNote = notes.findIndex((note) => note.id === id) > -1;
			return isNote;
		}
		return false;
	};

	return (
		<div className='flex flex-column items-center justify-center pa3 bg-washed-red'>
			<h1 className='code f2-l'>Amplify Notetaker</h1>
			{/* Note Form */}
			<form onSubmit={handleAddNote} className='mb3'>
				<input
					type='text'
					className='pa2 f4'
					onChange={handleChangeNote}
					value={note}
					placeholder='Write your note'
				/>
				<button type='submit' className='pa2 f4'>
					{id ? 'Update Note' : 'Add Note'}
				</button>
			</form>

			{/* Notes List */}
			<div>
				{notes.map((item) => (
					<div key={item.id} className='flex items-center'>
						<li onClick={() => handleSetNote(item)} className='list pa1 f3'>
							{item.note}
						</li>
						<button
							onClick={() => handleDeleteNote(item.id)}
							className='bg-transparent bn f4'
						>
							<span>&times;</span>
						</button>
					</div>
				))}
			</div>
		</div>
	);
}

export default withAuthenticator(App, { includeGreetings: true });

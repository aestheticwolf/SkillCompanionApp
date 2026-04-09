# Fix Add Goal Click Not Working

## Diagnosis
- UI button → TaskContext.addGoal → firestoreTasks.addUserGoal → Firestore addDoc()
- 'nothing happens' = await hanging, saving=true forever
- No console errors = Firestore silent fail (permissions/offline)

## Steps
- [ ] 1. Add logging/error handling to firestoreTasks.addUserGoal
- [ ] 2. Test Firestore write permissions
- [ ] 3. Add localStorage fallback
- [ ] 4. Test complete flow
- [ ] 5. Update goals list refresh

## Priority Files
1. `src/services/firestoreTasks.ts` - Add .catch()
2. `app/add-goal.tsx` - Better error UI
3. Test: npx expo start --clear


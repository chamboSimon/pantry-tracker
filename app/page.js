'use client'
import { firestore } from "@/firebase";
import { Box, Typography, Stack, TextField, Button, Modal, IconButton, Paper, Grid, Container } from "@mui/material";
import { doc, collection, deleteDoc, getDocs, query, getDoc, setDoc } from "firebase/firestore";
import { useState, useEffect } from "react";
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemAmount, setItemAmount] = useState('');
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, 'inventory'));
    const docs = await getDocs(snapshot);
    const inventoryList = [];
    docs.forEach((doc) => {
      inventoryList.push({
        name: doc.id,
        ...doc.data(),
      });
    });
    setInventory(inventoryList);
    setFilteredItems(inventoryList); // Initially set filtered items to the full inventory
  };

  const addItem = async (item, amount) => {
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const { quantity, amount: existingAmount } = docSnap.data();
      await setDoc(docRef, { quantity: quantity + 1, amount: existingAmount + parseFloat(amount) });
    } else {
      await setDoc(docRef, { quantity: 1, amount: parseFloat(amount) });
    }

    await updateInventory();
  };

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const { quantity, amount } = docSnap.data();
      if (quantity === 1) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, { quantity: quantity - 1, amount: amount - amount / quantity });
      }
    }

    await updateInventory();
  };

  useEffect(() => {
    updateInventory();
  }, []);

  const handleOpen = () => {
    setItemName('');
    setItemAmount('');
    setError('');
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleAddItem = () => {
    // Validate input
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(itemName)) {
      setError('Item name should contain only letters and spaces.');
      return;
    }
    if (isNaN(itemAmount) || itemAmount <= 0) {
      setError('Amount should be a positive number.');
      return;
    }

    setError('');
    addItem(itemName, itemAmount);
    setItemName('');
    setItemAmount('');
    handleClose();
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleSearch = () => {
    const filtered = inventory.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredItems(filtered);
  };

  const handleResetSearch = () => {
    setSearchQuery('');
    setFilteredItems(inventory);
  };

  const handleKeyDown = (event, action) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      action();
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap">
        <Typography variant="h4" component="h1" color="primary" sx={{ mb: { xs: 2, md: 0 } }}>
          Pantry Inventory
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpen}
          sx={{ mb: { xs: 2, md: 0 } }}
        >
          Add New Item
        </Button>
      </Box>

      <Box display="flex" alignItems="center" mb={2} flexDirection={{ xs: 'column', md: 'row' }}>
        <TextField
          variant="outlined"
          placeholder="Search items"
          value={searchQuery}
          onChange={handleSearchChange}
          onKeyDown={(event) => handleKeyDown(event, handleSearch)}
          fullWidth
          sx={{ mr: { md: 1 }, mb: { xs: 2, md: 0 } }}
        />
        <IconButton color="primary" onClick={handleSearch}>
          <SearchIcon />
        </IconButton>
      </Box>

      {filteredItems.length === 0 ? (
        <Box textAlign="center" mt={4}>
          <Typography variant="h6" gutterBottom>
            No items found. Please try a different search term.
          </Typography>
          <Box display="flex" justifyContent="center" gap={2} mt={2} flexWrap="wrap">
            <Button variant="contained" color="primary" onClick={handleResetSearch}>
              Go Back to Home
            </Button>
            <Button variant="outlined" color="primary" onClick={() => setSearchQuery('')}>
              Search Again
            </Button>
          </Box>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredItems.map(({ name, quantity, amount }) => (
            <Grid item xs={12} sm={6} md={4} key={name}>
              <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Typography variant="h6" component="h2" gutterBottom>
                  {name.charAt(0).toUpperCase() + name.slice(1)}
                </Typography>
                <Typography variant="body1">
                  Quantity: {quantity}
                </Typography>
                <Typography variant="body1">
                  Amount: ${amount !== undefined ? amount.toFixed(2) : '0.00'}
                </Typography>
                <Box display="flex" justifyContent="space-between" mt={2}>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => addItem(name, amount / quantity)}
                  >
                    Add
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => removeItem(name)}
                  >
                    Remove
                  </Button>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      <Modal open={open} onClose={handleClose}>
        <Box
          position="absolute"
          top="50%"
          left="50%"
          width={{ xs: 300, md: 400 }}
          bgcolor="white"
          border="2px solid #000"
          boxShadow={24}
          p={4}
          display="flex"
          flexDirection="column"
          gap={3}
          sx={{
            transform: 'translate(-50%, -50%)',
          }}
        >
          <Typography variant="h6">Add Item</Typography>
          <Stack width="100%" direction="column" spacing={2}>
            <TextField
              variant="outlined"
              fullWidth
              value={itemName}
              placeholder="Item Name"
              onChange={(e) => setItemName(e.target.value)}
              onKeyDown={(event) => handleKeyDown(event, handleAddItem)}
            />
            <TextField
              variant="outlined"
              fullWidth
              value={itemAmount}
              placeholder="Amount"
              onChange={(e) => setItemAmount(e.target.value)}
              onKeyDown={(event) => handleKeyDown(event, handleAddItem)}
            />
            {error && (
              <Typography variant="body2" color="red">
                {error}
              </Typography>
            )}
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddItem}
            >
              Add
            </Button>
          </Stack>
        </Box>
      </Modal>
    </Container>
  );
}

'use client'
import { firestore } from "@/firebase";
import { Box, Typography, Stack, TextField, Button, Modal, IconButton, Paper, Grid, Container } from "@mui/material";
import { doc, collection, deleteDoc, getDocs, query, getDoc, setDoc } from "firebase/firestore";
import { useState, useEffect } from "react";
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { Analytics } from "@vercel/analytics/react"

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState('');
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

  const addItem = async (item, quantity) => {
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const { quantity: existingQuantity } = docSnap.data();
      await setDoc(docRef, { quantity: existingQuantity + parseInt(quantity) });
    } else {
      await setDoc(docRef, { quantity: parseInt(quantity) });
    }

    await updateInventory();
  };

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      if (quantity === 1) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, { quantity: quantity - 1 });
      }
    }

    await updateInventory();
  };

  useEffect(() => {
    updateInventory();
  }, []);

  const handleOpen = () => {
    setItemName('');
    setItemQuantity('');
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
    if (isNaN(itemQuantity) || itemQuantity <= 0) {
      setError('Quantity should be a positive number.');
      return;
    }

    setError('');
    addItem(itemName, itemQuantity);
    setItemName('');
    setItemQuantity('');
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
        <Box display="flex" alignItems="center" sx={{ gap: 1 }}>
          <TextField
            variant="outlined"
            placeholder="Search items"
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={(event) => handleKeyDown(event, handleSearch)}
            sx={{ width: { xs: '100%', sm: 'auto' }, mb: { xs: 2, md: 0 } }}
          />
          <IconButton color="primary" onClick={handleSearch}>
            <SearchIcon />
          </IconButton>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpen}
          >
            Add New Item
          </Button>
        </Box>
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
          {filteredItems.map(({ name, quantity }) => (
            <Grid item xs={12} sm={6} md={4} key={name}>
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: 2,
                  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 6,
                  },
                }}
              >
                <Typography variant="h6" component="h2" gutterBottom>
                  {name.charAt(0).toUpperCase() + name.slice(1)}
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  Quantity: {quantity}
                </Typography>
                <Box display="flex" justifyContent="space-between" mt={2}>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => addItem(name, 1)}
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
          bgcolor="grey.200"
          border="2px solid #000"
          boxShadow={24}
          p={4}
          display="flex"
          flexDirection="column"
          gap={3}
          sx={{
            transform: 'translate(-50%, -50%)',
            borderRadius: 2,
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
              value={itemQuantity}
              placeholder="Quantity"
              onChange={(e) => setItemQuantity(e.target.value)}
              onKeyDown={(event) => handleKeyDown(event, handleAddItem)}
            />
            {error && (
              <Typography variant="body2" color="error">
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

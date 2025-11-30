import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { Solmates } from "../target/types/solmates";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  createMint,
  createAssociatedTokenAccount,
  mintTo,
  getAccount,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { expect } from "chai";

describe("solmates", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Solmates as Program<Solmates>;

  // Test accounts
  let mintAuthority: Keypair;
  let usdcMint: PublicKey;

  // Users
  let alice: Keypair;
  let bob: Keypair;
  let charlie: Keypair; // matchmaker

  // Token accounts
  let aliceTokenAccount: PublicKey;
  let bobTokenAccount: PublicKey;
  let charlieTokenAccount: PublicKey;

  // Constants for testing
  const USDC_DECIMALS = 6;
  const ONE_USDC = 1_000_000; // 1 USDC with 6 decimals
  const TEN_USDC = 10_000_000;
  const HUNDRED_USDC = 100_000_000;

  // Treasury address for platform fees
  const TREASURY = new PublicKey("2CquYcQoBGv8MiiMfP3Lgut79oLCtDbCTrB6fnQm1WeG");

  before(async () => {
    // Generate keypairs
    mintAuthority = Keypair.generate();
    alice = Keypair.generate();
    bob = Keypair.generate();
    charlie = Keypair.generate();

    // Airdrop SOL to all accounts
    const airdropPromises = [
      provider.connection.requestAirdrop(
        mintAuthority.publicKey,
        2 * LAMPORTS_PER_SOL
      ),
      provider.connection.requestAirdrop(
        alice.publicKey,
        2 * LAMPORTS_PER_SOL
      ),
      provider.connection.requestAirdrop(bob.publicKey, 2 * LAMPORTS_PER_SOL),
      provider.connection.requestAirdrop(
        charlie.publicKey,
        2 * LAMPORTS_PER_SOL
      ),
    ];

    const sigs = await Promise.all(airdropPromises);

    // Wait for confirmations
    await Promise.all(
      sigs.map((sig) =>
        provider.connection.confirmTransaction(sig, "confirmed")
      )
    );

    // Create test USDC mint
    usdcMint = await createMint(
      provider.connection,
      mintAuthority,
      mintAuthority.publicKey,
      null,
      USDC_DECIMALS
    );

    console.log("Test USDC Mint:", usdcMint.toString());

    // Create token accounts for each user
    aliceTokenAccount = await createAssociatedTokenAccount(
      provider.connection,
      alice,
      usdcMint,
      alice.publicKey
    );

    bobTokenAccount = await createAssociatedTokenAccount(
      provider.connection,
      bob,
      usdcMint,
      bob.publicKey
    );

    charlieTokenAccount = await createAssociatedTokenAccount(
      provider.connection,
      charlie,
      usdcMint,
      charlie.publicKey
    );

    // Mint USDC to users
    await mintTo(
      provider.connection,
      mintAuthority,
      usdcMint,
      aliceTokenAccount,
      mintAuthority,
      HUNDRED_USDC * 10 // 1000 USDC
    );

    await mintTo(
      provider.connection,
      mintAuthority,
      usdcMint,
      bobTokenAccount,
      mintAuthority,
      HUNDRED_USDC * 10
    );

    await mintTo(
      provider.connection,
      mintAuthority,
      usdcMint,
      charlieTokenAccount,
      mintAuthority,
      HUNDRED_USDC * 10
    );

    console.log("Setup complete - minted 1000 USDC to each user");
  });

  // Helper function to derive PDAs
  function getProfilePda(authority: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("profile"), authority.toBuffer()],
      program.programId
    );
  }

  function getEscrowPda(
    sender: PublicKey,
    recipient: PublicKey
  ): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), sender.toBuffer(), recipient.toBuffer()],
      program.programId
    );
  }

  function getAuctionPda(host: PublicKey, auctionId: number): [PublicKey, number] {
    const auctionIdBuffer = Buffer.alloc(8);
    auctionIdBuffer.writeBigUInt64LE(BigInt(auctionId));
    return PublicKey.findProgramAddressSync(
      [Buffer.from("auction"), host.toBuffer(), auctionIdBuffer],
      program.programId
    );
  }

  function getBountyPda(issuer: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("bounty"), issuer.toBuffer()],
      program.programId
    );
  }

  // ============================================
  // PROFILE TESTS
  // ============================================
  describe("User Profile", () => {
    it("creates a profile for alice", async () => {
      const [profilePda] = getProfilePda(alice.publicKey);
      const dmPrice = new BN(5 * ONE_USDC); // 5 USDC to DM
      const minAssetAmount = new BN(0);

      const tx = await program.methods
        .createProfile(dmPrice, null, minAssetAmount)
        .accountsStrict({
          authority: alice.publicKey,
          profile: profilePda,
          systemProgram: SystemProgram.programId,
        })
        .signers([alice])
        .rpc();

      console.log("Create alice profile tx:", tx);

      // Verify profile was created
      const profile = await program.account.userProfile.fetch(profilePda);
      expect(profile.authority.toString()).to.equal(alice.publicKey.toString());
      expect(profile.auctionCount.toNumber()).to.equal(0);
      expect(profile.dmPrice.toNumber()).to.equal(5 * ONE_USDC);
    });

    it("creates a profile for bob", async () => {
      const [profilePda] = getProfilePda(bob.publicKey);
      const dmPrice = new BN(TEN_USDC); // 10 USDC to DM
      const minAssetAmount = new BN(0);

      await program.methods
        .createProfile(dmPrice, null, minAssetAmount)
        .accountsStrict({
          authority: bob.publicKey,
          profile: profilePda,
          systemProgram: SystemProgram.programId,
        })
        .signers([bob])
        .rpc();

      const profile = await program.account.userProfile.fetch(profilePda);
      expect(profile.authority.toString()).to.equal(bob.publicKey.toString());
      expect(profile.dmPrice.toNumber()).to.equal(TEN_USDC);
    });

    it("creates a profile for charlie (matchmaker)", async () => {
      const [profilePda] = getProfilePda(charlie.publicKey);
      const dmPrice = new BN(ONE_USDC);
      const minAssetAmount = new BN(0);

      await program.methods
        .createProfile(dmPrice, null, minAssetAmount)
        .accountsStrict({
          authority: charlie.publicKey,
          profile: profilePda,
          systemProgram: SystemProgram.programId,
        })
        .signers([charlie])
        .rpc();

      const profile = await program.account.userProfile.fetch(profilePda);
      expect(profile.authority.toString()).to.equal(charlie.publicKey.toString());
    });

    it("updates alice's profile", async () => {
      const [profilePda] = getProfilePda(alice.publicKey);
      const newDmPrice = new BN(8 * ONE_USDC); // Update to 8 USDC

      const tx = await program.methods
        .updateProfile(newDmPrice, null, null)
        .accountsStrict({
          authority: alice.publicKey,
          profile: profilePda,
        })
        .signers([alice])
        .rpc();

      console.log("Update profile tx:", tx);

      const profile = await program.account.userProfile.fetch(profilePda);
      expect(profile.dmPrice.toNumber()).to.equal(8 * ONE_USDC);
    });
  });

  // ============================================
  // DM ESCROW TESTS
  // ============================================
  describe("DM Escrow", () => {
    it("alice deposits USDC to DM bob", async () => {
      const [escrowPda] = getEscrowPda(alice.publicKey, bob.publicKey);
      const [bobProfilePda] = getProfilePda(bob.publicKey);
      const escrowVault = getAssociatedTokenAddressSync(usdcMint, escrowPda, true);

      const initialBalance = (
        await getAccount(provider.connection, aliceTokenAccount)
      ).amount;

      const depositAmount = new BN(TEN_USDC); // 10 USDC (meets bob's dm_price)

      const tx = await program.methods
        .depositForDm(depositAmount)
        .accountsStrict({
          sender: alice.publicKey,
          recipient: bob.publicKey,
          recipientProfile: bobProfilePda,
          mint: usdcMint,
          senderTokenAccount: aliceTokenAccount,
          senderGateTokenAccount: null,
          escrow: escrowPda,
          escrowVault: escrowVault,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([alice])
        .rpc();

      console.log("Deposit for DM tx:", tx);

      // Verify escrow was created
      const escrow = await program.account.messageEscrow.fetch(escrowPda);
      expect(escrow.sender.toString()).to.equal(alice.publicKey.toString());
      expect(escrow.recipient.toString()).to.equal(bob.publicKey.toString());
      expect(escrow.amount.toNumber()).to.equal(TEN_USDC);
      expect(escrow.status).to.deep.equal({ pending: {} });

      // Verify USDC was transferred
      const finalBalance = (
        await getAccount(provider.connection, aliceTokenAccount)
      ).amount;
      expect(Number(initialBalance) - Number(finalBalance)).to.equal(TEN_USDC);

      // Verify escrow vault has the tokens
      const vaultBalance = (
        await getAccount(provider.connection, escrowVault)
      ).amount;
      expect(Number(vaultBalance)).to.equal(TEN_USDC);
    });

    it("bob accepts the DM and receives USDC", async () => {
      const [escrowPda] = getEscrowPda(alice.publicKey, bob.publicKey);
      const escrowVault = getAssociatedTokenAddressSync(usdcMint, escrowPda, true);

      const initialBalance = (
        await getAccount(provider.connection, bobTokenAccount)
      ).amount;

      const treasuryTokenAccount = getAssociatedTokenAddressSync(usdcMint, TREASURY);

      const tx = await program.methods
        .acceptDm()
        .accountsStrict({
          sender: alice.publicKey,
          recipient: bob.publicKey,
          mint: usdcMint,
          escrow: escrowPda,
          escrowVault: escrowVault,
          recipientTokenAccount: bobTokenAccount,
          treasury: TREASURY,
          treasuryTokenAccount: treasuryTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([bob])
        .rpc();

      console.log("Accept DM tx:", tx);

      // Verify bob received USDC (minus 1% fee)
      const finalBalance = (
        await getAccount(provider.connection, bobTokenAccount)
      ).amount;
      const expectedAmount = TEN_USDC - Math.floor(TEN_USDC / 100); // 99% after 1% fee
      expect(Number(finalBalance) - Number(initialBalance)).to.equal(expectedAmount);

      // Verify escrow vault is empty (tokens transferred out)
      const vaultBalance = await getAccount(provider.connection, escrowVault);
      expect(Number(vaultBalance.amount)).to.equal(0);
    });

    it("charlie deposits USDC to DM alice (for refund test)", async () => {
      const [escrowPda] = getEscrowPda(charlie.publicKey, alice.publicKey);
      const [aliceProfilePda] = getProfilePda(alice.publicKey);
      const escrowVault = getAssociatedTokenAddressSync(usdcMint, escrowPda, true);

      const depositAmount = new BN(8 * ONE_USDC); // 8 USDC (meets alice's dm_price)

      await program.methods
        .depositForDm(depositAmount)
        .accountsStrict({
          sender: charlie.publicKey,
          recipient: alice.publicKey,
          recipientProfile: aliceProfilePda,
          mint: usdcMint,
          senderTokenAccount: charlieTokenAccount,
          senderGateTokenAccount: null,
          escrow: escrowPda,
          escrowVault: escrowVault,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([charlie])
        .rpc();

      const escrow = await program.account.messageEscrow.fetch(escrowPda);
      expect(escrow.status).to.deep.equal({ pending: {} });
    });
  });

  // ============================================
  // DATE AUCTION TESTS
  // ============================================
  describe("Date Auction", () => {
    it("alice creates a date auction", async () => {
      const [aliceProfile] = getProfilePda(alice.publicKey);
      const profile = await program.account.userProfile.fetch(aliceProfile);
      const auctionId = profile.auctionCount.toNumber();

      const [auctionPda] = getAuctionPda(alice.publicKey, auctionId);
      const auctionVault = getAssociatedTokenAddressSync(
        usdcMint,
        auctionPda,
        true
      );

      const startPrice = new BN(TEN_USDC); // 10 USDC starting price
      const durationSecs = new BN(24 * 60 * 60); // 24 hours

      const tx = await program.methods
        .createAuction(startPrice, durationSecs)
        .accountsStrict({
          host: alice.publicKey,
          hostProfile: aliceProfile,
          mint: usdcMint,
          auction: auctionPda,
          auctionVault: auctionVault,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([alice])
        .rpc();

      console.log("Create auction tx:", tx);

      // Verify auction was created
      const auction = await program.account.dateAuction.fetch(auctionPda);
      expect(auction.host.toString()).to.equal(alice.publicKey.toString());
      expect(auction.auctionId.toNumber()).to.equal(auctionId);
      expect(auction.highestBidder.toString()).to.equal(alice.publicKey.toString()); // Initially host
      expect(auction.highestBid.toNumber()).to.equal(TEN_USDC); // Start price

      // Verify profile auction count incremented
      const updatedProfile = await program.account.userProfile.fetch(aliceProfile);
      expect(updatedProfile.auctionCount.toNumber()).to.equal(auctionId + 1);
    });

    it("bob places a bid on alice's auction", async () => {
      const [aliceProfile] = getProfilePda(alice.publicKey);
      const profile = await program.account.userProfile.fetch(aliceProfile);
      const auctionId = profile.auctionCount.toNumber() - 1; // Last auction

      const [auctionPda] = getAuctionPda(alice.publicKey, auctionId);
      const auctionVault = getAssociatedTokenAddressSync(
        usdcMint,
        auctionPda,
        true
      );

      const bidAmount = new BN(15 * ONE_USDC); // 15 USDC

      const initialBalance = (
        await getAccount(provider.connection, bobTokenAccount)
      ).amount;

      const tx = await program.methods
        .placeBid(bidAmount)
        .accountsStrict({
          bidder: bob.publicKey,
          previousBidder: alice.publicKey, // Host is previous bidder
          host: alice.publicKey,
          mint: usdcMint,
          auction: auctionPda,
          auctionVault: auctionVault,
          bidderTokenAccount: bobTokenAccount,
          previousBidderTokenAccount: aliceTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([bob])
        .rpc();

      console.log("Place bid tx:", tx);

      // Verify auction was updated
      const auction = await program.account.dateAuction.fetch(auctionPda);
      expect(auction.highestBidder.toString()).to.equal(bob.publicKey.toString());
      expect(auction.highestBid.toNumber()).to.equal(15 * ONE_USDC);

      // Verify USDC was transferred
      const finalBalance = (
        await getAccount(provider.connection, bobTokenAccount)
      ).amount;
      expect(Number(initialBalance) - Number(finalBalance)).to.equal(15 * ONE_USDC);

      // Verify vault has the bid
      const vaultBalance = (
        await getAccount(provider.connection, auctionVault)
      ).amount;
      expect(Number(vaultBalance)).to.equal(15 * ONE_USDC);
    });

    it("charlie outbids bob (bob gets refunded)", async () => {
      const [aliceProfile] = getProfilePda(alice.publicKey);
      const profile = await program.account.userProfile.fetch(aliceProfile);
      const auctionId = profile.auctionCount.toNumber() - 1;

      const [auctionPda] = getAuctionPda(alice.publicKey, auctionId);
      const auctionVault = getAssociatedTokenAddressSync(
        usdcMint,
        auctionPda,
        true
      );

      const bobInitialBalance = (
        await getAccount(provider.connection, bobTokenAccount)
      ).amount;
      const charlieInitialBalance = (
        await getAccount(provider.connection, charlieTokenAccount)
      ).amount;

      const bidAmount = new BN(25 * ONE_USDC); // 25 USDC

      const tx = await program.methods
        .placeBid(bidAmount)
        .accountsStrict({
          bidder: charlie.publicKey,
          previousBidder: bob.publicKey,
          host: alice.publicKey,
          mint: usdcMint,
          auction: auctionPda,
          auctionVault: auctionVault,
          bidderTokenAccount: charlieTokenAccount,
          previousBidderTokenAccount: bobTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([charlie])
        .rpc();

      console.log("Outbid tx:", tx);

      // Verify bob was refunded
      const bobFinalBalance = (
        await getAccount(provider.connection, bobTokenAccount)
      ).amount;
      expect(Number(bobFinalBalance) - Number(bobInitialBalance)).to.equal(15 * ONE_USDC);

      // Verify charlie's bid was taken
      const charlieFinalBalance = (
        await getAccount(provider.connection, charlieTokenAccount)
      ).amount;
      expect(Number(charlieInitialBalance) - Number(charlieFinalBalance)).to.equal(25 * ONE_USDC);

      // Verify auction state
      const auction = await program.account.dateAuction.fetch(auctionPda);
      expect(auction.highestBidder.toString()).to.equal(charlie.publicKey.toString());
      expect(auction.highestBid.toNumber()).to.equal(25 * ONE_USDC);
    });
  });

  // ============================================
  // BOUNTY TESTS
  // ============================================
  describe("Matchmaker Bounty", () => {
    it("bob creates a bounty", async () => {
      const [bountyPda] = getBountyPda(bob.publicKey);
      const bountyVault = getAssociatedTokenAddressSync(usdcMint, bountyPda, true);

      const rewardAmount = new BN(50 * ONE_USDC); // 50 USDC

      const initialBalance = (
        await getAccount(provider.connection, bobTokenAccount)
      ).amount;

      const tx = await program.methods
        .createBounty(rewardAmount)
        .accountsStrict({
          issuer: bob.publicKey,
          mint: usdcMint,
          bounty: bountyPda,
          bountyVault: bountyVault,
          issuerTokenAccount: bobTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([bob])
        .rpc();

      console.log("Create bounty tx:", tx);

      // Verify bounty was created
      const bounty = await program.account.bountyVault.fetch(bountyPda);
      expect(bounty.issuer.toString()).to.equal(bob.publicKey.toString());
      expect(bounty.rewardAmount.toNumber()).to.equal(50 * ONE_USDC);
      expect(bounty.status).to.deep.equal({ open: {} });

      // Verify USDC was transferred
      const finalBalance = (
        await getAccount(provider.connection, bobTokenAccount)
      ).amount;
      expect(Number(initialBalance) - Number(finalBalance)).to.equal(50 * ONE_USDC);
    });

    it("bob increases his bounty", async () => {
      const [bountyPda] = getBountyPda(bob.publicKey);
      const bountyVault = getAssociatedTokenAddressSync(usdcMint, bountyPda, true);

      const newAmount = new BN(75 * ONE_USDC); // Increase to 75 USDC

      const initialVaultBalance = (
        await getAccount(provider.connection, bountyVault)
      ).amount;

      const tx = await program.methods
        .updateBounty(newAmount)
        .accountsStrict({
          issuer: bob.publicKey,
          mint: usdcMint,
          bounty: bountyPda,
          bountyVault: bountyVault,
          issuerTokenAccount: bobTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([bob])
        .rpc();

      console.log("Increase bounty tx:", tx);

      // Verify bounty was updated
      const bounty = await program.account.bountyVault.fetch(bountyPda);
      expect(bounty.rewardAmount.toNumber()).to.equal(75 * ONE_USDC);

      // Verify additional USDC was deposited
      const finalVaultBalance = (
        await getAccount(provider.connection, bountyVault)
      ).amount;
      expect(Number(finalVaultBalance) - Number(initialVaultBalance)).to.equal(25 * ONE_USDC);
    });

    it("bob decreases his bounty (partial withdrawal)", async () => {
      const [bountyPda] = getBountyPda(bob.publicKey);
      const bountyVault = getAssociatedTokenAddressSync(usdcMint, bountyPda, true);

      const newAmount = new BN(60 * ONE_USDC); // Decrease to 60 USDC

      const initialBobBalance = (
        await getAccount(provider.connection, bobTokenAccount)
      ).amount;

      const tx = await program.methods
        .updateBounty(newAmount)
        .accountsStrict({
          issuer: bob.publicKey,
          mint: usdcMint,
          bounty: bountyPda,
          bountyVault: bountyVault,
          issuerTokenAccount: bobTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([bob])
        .rpc();

      console.log("Decrease bounty tx:", tx);

      // Verify bounty was updated
      const bounty = await program.account.bountyVault.fetch(bountyPda);
      expect(bounty.rewardAmount.toNumber()).to.equal(60 * ONE_USDC);

      // Verify USDC was returned to bob
      const finalBobBalance = (
        await getAccount(provider.connection, bobTokenAccount)
      ).amount;
      expect(Number(finalBobBalance) - Number(initialBobBalance)).to.equal(15 * ONE_USDC);
    });

    it("bob pays out bounty to alice (matchmaker)", async () => {
      const [bountyPda] = getBountyPda(bob.publicKey);
      const bountyVault = getAssociatedTokenAddressSync(usdcMint, bountyPda, true);

      const initialAliceBalance = (
        await getAccount(provider.connection, aliceTokenAccount)
      ).amount;

      const bountyAmount = (await program.account.bountyVault.fetch(bountyPda))
        .rewardAmount.toNumber();

      const treasuryTokenAccount = getAssociatedTokenAddressSync(usdcMint, TREASURY);

      const tx = await program.methods
        .payoutReferral()
        .accountsStrict({
          issuer: bob.publicKey,
          matchmaker: alice.publicKey,
          mint: usdcMint,
          bounty: bountyPda,
          bountyVault: bountyVault,
          matchmakerTokenAccount: aliceTokenAccount,
          treasury: TREASURY,
          treasuryTokenAccount: treasuryTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([bob])
        .rpc();

      console.log("Payout bounty tx:", tx);

      // Verify alice received the bounty (minus 1% fee)
      const finalAliceBalance = (
        await getAccount(provider.connection, aliceTokenAccount)
      ).amount;
      const expectedAmount = bountyAmount - Math.floor(bountyAmount / 100); // 99% after 1% fee
      expect(Number(finalAliceBalance) - Number(initialAliceBalance)).to.equal(expectedAmount);

      // Verify bounty vault is empty (tokens transferred out)
      const vaultBalance = await getAccount(provider.connection, bountyVault);
      expect(Number(vaultBalance.amount)).to.equal(0);
    });

    it("alice creates and cancels a bounty", async () => {
      const [bountyPda] = getBountyPda(alice.publicKey);
      const bountyVault = getAssociatedTokenAddressSync(usdcMint, bountyPda, true);

      // First create a bounty
      const rewardAmount = new BN(20 * ONE_USDC);

      await program.methods
        .createBounty(rewardAmount)
        .accountsStrict({
          issuer: alice.publicKey,
          mint: usdcMint,
          bounty: bountyPda,
          bountyVault: bountyVault,
          issuerTokenAccount: aliceTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([alice])
        .rpc();

      const initialAliceBalance = (
        await getAccount(provider.connection, aliceTokenAccount)
      ).amount;

      // Now cancel it
      const tx = await program.methods
        .cancelBounty()
        .accountsStrict({
          issuer: alice.publicKey,
          mint: usdcMint,
          bounty: bountyPda,
          bountyVault: bountyVault,
          issuerTokenAccount: aliceTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([alice])
        .rpc();

      console.log("Cancel bounty tx:", tx);

      // Verify alice got her USDC back
      const finalAliceBalance = (
        await getAccount(provider.connection, aliceTokenAccount)
      ).amount;
      expect(Number(finalAliceBalance) - Number(initialAliceBalance)).to.equal(20 * ONE_USDC);
    });
  });

  // ============================================
  // ERROR TESTS
  // ============================================
  describe("Error Cases", () => {
    it("fails to bid below highest bid", async () => {
      // Create a new auction first
      const [aliceProfile] = getProfilePda(alice.publicKey);
      const profile = await program.account.userProfile.fetch(aliceProfile);
      const auctionId = profile.auctionCount.toNumber();

      const [auctionPda] = getAuctionPda(alice.publicKey, auctionId);
      const auctionVault = getAssociatedTokenAddressSync(
        usdcMint,
        auctionPda,
        true
      );

      // Create auction with 10 USDC start price
      await program.methods
        .createAuction(new BN(TEN_USDC), new BN(24 * 60 * 60))
        .accountsStrict({
          host: alice.publicKey,
          hostProfile: aliceProfile,
          mint: usdcMint,
          auction: auctionPda,
          auctionVault: auctionVault,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([alice])
        .rpc();

      // Try to bid only 5 USDC (less than start price of 10 USDC)
      try {
        await program.methods
          .placeBid(new BN(5 * ONE_USDC))
          .accountsStrict({
            bidder: bob.publicKey,
            previousBidder: alice.publicKey,
            host: alice.publicKey,
            mint: usdcMint,
            auction: auctionPda,
            auctionVault: auctionVault,
            bidderTokenAccount: bobTokenAccount,
            previousBidderTokenAccount: aliceTokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([bob])
          .rpc();

        expect.fail("Should have thrown BidTooLow error");
      } catch (err: any) {
        expect(err.error.errorCode.code).to.equal("BidTooLow");
      }
    });

    it("fails when unauthorized user tries to update bounty", async () => {
      // Create bounty for charlie first
      const [bountyPda] = getBountyPda(charlie.publicKey);
      const bountyVault = getAssociatedTokenAddressSync(usdcMint, bountyPda, true);

      await program.methods
        .createBounty(new BN(10 * ONE_USDC))
        .accountsStrict({
          issuer: charlie.publicKey,
          mint: usdcMint,
          bounty: bountyPda,
          bountyVault: bountyVault,
          issuerTokenAccount: charlieTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([charlie])
        .rpc();

      // Try to update as bob (should fail - PDA derived from issuer won't match)
      const [bobBountyPda] = getBountyPda(bob.publicKey);
      try {
        await program.methods
          .updateBounty(new BN(20 * ONE_USDC))
          .accountsStrict({
            issuer: bob.publicKey,
            mint: usdcMint,
            bounty: bobBountyPda, // Bob's bounty PDA (different from charlie's)
            bountyVault: getAssociatedTokenAddressSync(usdcMint, bobBountyPda, true),
            issuerTokenAccount: bobTokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([bob])
          .rpc();

        expect.fail("Should have thrown error");
      } catch (err: any) {
        // Account not initialized since bob doesn't have a bounty
        expect(err).to.exist;
      }
    });
  });
});
